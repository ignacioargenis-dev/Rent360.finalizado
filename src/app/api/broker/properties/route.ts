import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/api-error-handler';
import { UserRole } from '@/types';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== UserRole.BROKER) {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol de corredor.' },
        { status: 403 }
      );
    }

    logger.info('Creando propiedad para corredor', { userId: user.id });

    const formData = await request.formData();

    // Extract property data
    const propertyData = {
      title: formData.get('title') as string,
      address: formData.get('address') as string,
      city: formData.get('city') as string,
      region: formData.get('region') as string,
      price: parseInt(formData.get('price') as string),
      bedrooms: formData.get('bedrooms') ? parseInt(formData.get('bedrooms') as string) : null,
      bathrooms: formData.get('bathrooms') ? parseInt(formData.get('bathrooms') as string) : null,
      area: formData.get('area') ? parseFloat(formData.get('area') as string) : null,
      description: formData.get('description') as string,
      propertyType: formData.get('propertyType') as string,
      furnished: formData.get('furnished') === 'true',
      parking: formData.get('parking') === 'true',
      petsAllowed: formData.get('petsAllowed') === 'true',
    };

    // Validate required fields
    if (!propertyData.title || !propertyData.address || !propertyData.price) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios de la propiedad' },
        { status: 400 }
      );
    }

    // Extract owner data
    const ownerData = {
      name: formData.get('ownerName') as string,
      email: formData.get('ownerEmail') as string,
      phone: formData.get('ownerPhone') as string,
      rut: formData.get('ownerRut') as string,
      isRegistered: formData.get('ownerIsRegistered') === 'true',
    };

    // Validate required fields
    if (!propertyData.title || !propertyData.address || !propertyData.price) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios de la propiedad' },
        { status: 400 }
      );
    }

    if (!ownerData.name || !ownerData.email || !ownerData.phone || !ownerData.rut) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios del propietario' },
        { status: 400 }
      );
    }

    // Handle owner creation/management
    let ownerId: string;

    if (ownerData.isRegistered) {
      // Find existing owner by RUT or email
      const existingOwner = await db.user.findFirst({
        where: {
          OR: [
            { rut: ownerData.rut },
            { email: ownerData.email }
          ],
          role: UserRole.OWNER
        }
      });

      if (!existingOwner) {
        return NextResponse.json(
          { error: 'Propietario registrado no encontrado. Verifique el RUT o email.' },
          { status: 400 }
        );
      }

      ownerId = existingOwner.id;
    } else {
      // Create virtual owner record for unregistered owners
      // This allows brokers to manage properties of non-registered owners
      const virtualOwner = await db.user.create({
        data: {
          email: ownerData.email,
          name: ownerData.name,
          phone: ownerData.phone,
          rut: ownerData.rut,
          role: UserRole.OWNER,
          password: '', // Virtual owners don't have passwords
          rutVerified: false, // Mark as not verified since they're not registered
        }
      });

      ownerId = virtualOwner.id;

      logger.info('Created virtual owner for broker-managed property', {
        ownerId,
        brokerId: user.id
      });
    }

    // Create property
    const features = {
      furnished: propertyData.furnished,
      parking: propertyData.parking,
      petsAllowed: propertyData.petsAllowed,
    };

    const property = await db.property.create({
      data: {
        title: propertyData.title,
        address: propertyData.address,
        city: propertyData.city,
        commune: propertyData.city, // Use city as commune for now
        region: propertyData.region,
        price: propertyData.price,
        deposit: propertyData.price, // Use price as deposit for now
        bedrooms: propertyData.bedrooms,
        bathrooms: propertyData.bathrooms,
        area: propertyData.area,
        description: propertyData.description,
        type: propertyData.propertyType,
        features: JSON.stringify(features), // Store features as JSON
        status: 'AVAILABLE',
        ownerId: ownerId,
        brokerId: user.id, // Link to broker for management
        createdBy: user.id,
      }
    });

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads', 'properties', property.id);
    await mkdir(uploadsDir, { recursive: true });

    // Handle file uploads
    const uploadedFiles: any[] = [];

    // Upload images
    const imageFiles = formData.getAll('images') as File[];
    for (const image of imageFiles) {
      if (image && image.size > 0) {
        const fileName = `image_${Date.now()}_${image.name}`;
        const filePath = path.join(uploadsDir, fileName);

        const buffer = Buffer.from(await image.arrayBuffer());
        await writeFile(filePath, buffer);

        // Save image record to database
        await db.propertyImage.create({
          data: {
            propertyId: property.id,
            url: `/uploads/properties/${property.id}/${fileName}`,
            alt: image.name,
            order: uploadedFiles.length,
          }
        });

        // Also update the legacy images field for compatibility
        const existingImages = property.images ? property.images.split(', ') : [];
        existingImages.push(`/uploads/properties/${property.id}/${fileName}`);
        await db.property.update({
          where: { id: property.id },
          data: { images: existingImages.join(', ') }
        });

        uploadedFiles.push({
          type: 'image',
          name: image.name,
          path: filePath
        });
      }
    }

    // Upload documents
    const documentFields = [
      { key: 'propertyDeed', label: 'Escritura de Propiedad' },
      { key: 'certificateOfTitle', label: 'Certificado de Título' },
      { key: 'propertyTaxReceipt', label: 'Recibo de Contribuciones' },
      { key: 'insurancePolicy', label: 'Póliza de Seguro' },
    ];

    for (const field of documentFields) {
      const file = formData.get(field.key) as File;
      if (file && file.size > 0) {
        const fileName = `${field.key}_${Date.now()}_${file.name}`;
        const filePath = path.join(uploadsDir, fileName);

        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(filePath, buffer);

        // Save document record to database
        await db.document.create({
          data: {
            name: field.label,
            type: 'PROPERTY_DOCUMENT',
            fileName: fileName,
            filePath: `/uploads/properties/${property.id}/${fileName}`,
            fileSize: file.size,
            mimeType: file.type,
            propertyId: property.id,
            uploadedById: user.id,
          }
        });

        uploadedFiles.push({
          type: 'document',
          name: field.label,
          path: filePath
        });
      }
    }

    // Upload utilities bills (multiple files)
    const utilitiesBills = formData.getAll('utilitiesBills') as File[];
    for (const bill of utilitiesBills) {
      if (bill && bill.size > 0) {
        const fileName = `utilities_bill_${Date.now()}_${bill.name}`;
        const filePath = path.join(uploadsDir, fileName);

        const buffer = Buffer.from(await bill.arrayBuffer());
        await writeFile(filePath, buffer);

        await db.document.create({
          data: {
            name: `Recibo de Servicios - ${bill.name}`,
            type: 'UTILITY_BILL',
            fileName: fileName,
            filePath: `/uploads/properties/${property.id}/${fileName}`,
            fileSize: bill.size,
            mimeType: bill.type,
            propertyId: property.id,
            uploadedById: user.id,
          }
        });

        uploadedFiles.push({
          type: 'utility_bill',
          name: bill.name,
          path: filePath
        });
      }
    }

    // Upload other documents (multiple files)
    const otherDocuments = formData.getAll('otherDocuments') as File[];
    for (const doc of otherDocuments) {
      if (doc && doc.size > 0) {
        const fileName = `other_document_${Date.now()}_${doc.name}`;
        const filePath = path.join(uploadsDir, fileName);

        const buffer = Buffer.from(await doc.arrayBuffer());
        await writeFile(filePath, buffer);

        await db.document.create({
          data: {
            name: `Documento Adicional - ${doc.name}`,
            type: 'OTHER_DOCUMENT',
            fileName: fileName,
            filePath: `/uploads/properties/${property.id}/${fileName}`,
            fileSize: doc.size,
            mimeType: doc.type,
            propertyId: property.id,
            uploadedById: user.id,
          }
        });

        uploadedFiles.push({
          type: 'other_document',
          name: doc.name,
          path: filePath
        });
      }
    }

    logger.info('Property created successfully with documents', {
      propertyId: property.id,
      brokerId: user.id,
      ownerId: ownerId,
      uploadedFiles: uploadedFiles.length,
      imagesCount: imageFiles.length,
      documentsCount: uploadedFiles.filter(f => f.type !== 'image').length
    });

    return NextResponse.json({
      success: true,
      message: 'Propiedad creada exitosamente',
      propertyId: property.id,
      uploadedFiles: uploadedFiles.length
    });

  } catch (error) {
    logger.error('Error creating property:', {
      error: error instanceof Error ? error.message : String(error)
    });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}
