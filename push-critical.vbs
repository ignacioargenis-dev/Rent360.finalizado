Set objShell = WScript.CreateObject("WScript.Shell")
objShell.CurrentDirectory = "C:\Users\Perrita\Documents\GitHub\Rent360.finalizado"

' Ejecutar comandos Git
objShell.Run "cmd /c git status --short", 1, True
objShell.Run "cmd /c git add .", 1, True
objShell.Run "cmd /c git commit -m ""fix: correccion definitiva error TypeScript createdAt

- Resolver error 'string | undefined' en contracts page
- Cambiar split('T')[0] por substring(0, 10) para mayor seguridad
- Garantizar formato YYYY-MM-DD valido
- Fix DigitalOcean App Platform build error
- Preparar despliegue exitoso""", 1, True
objShell.Run "cmd /c git push origin master", 1, True

' Mostrar mensaje de éxito
MsgBox "¡CORRECCIÓN SUBIDA EXITOSAMENTE A GITHUB!" & vbCrLf & vbCrLf & "El build de DigitalOcean debería funcionar correctamente ahora.", vbInformation, "Rent360 - Corrección Exitosa"
