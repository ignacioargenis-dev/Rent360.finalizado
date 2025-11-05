#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Configurando Husky...');

try {
  // Verificar si husky está instalado
  try {
    execSync('npx husky --version', { stdio: 'pipe' });
    console.log('✅ Husky ya está disponible');
  } catch (error) {
    console.log('📦 Instalando Husky...');
    execSync('npm install husky --save-dev', { stdio: 'inherit' });
  }

  // Inicializar husky
  console.log('🔧 Inicializando Husky...');
  execSync('npx husky init', { stdio: 'pipe' });

  // Configurar pre-commit hook
  const preCommitPath = path.join('.husky', 'pre-commit');
  const preCommitContent = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
`;

  if (fs.existsSync(preCommitPath)) {
    console.log('✅ Pre-commit hook ya existe');
  } else {
    fs.writeFileSync(preCommitPath, preCommitContent);
    fs.chmodSync(preCommitPath, '755');
    console.log('✅ Pre-commit hook creado');
  }

  // Configurar commit-msg hook (opcional)
  const commitMsgPath = path.join('.husky', 'commit-msg');
  const commitMsgContent = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx --no-install commitlint --edit "$1"
`;

  if (fs.existsSync(commitMsgPath)) {
    console.log('✅ Commit-msg hook ya existe');
  } else {
    // Solo crear si commitlint está disponible
    try {
      execSync('npx commitlint --version', { stdio: 'pipe' });
      fs.writeFileSync(commitMsgPath, commitMsgContent);
      fs.chmodSync(commitMsgPath, '755');
      console.log('✅ Commit-msg hook creado');
    } catch (error) {
      console.log('ℹ️ Commitlint no disponible, omitiendo commit-msg hook');
    }
  }

  console.log('🎉 Husky configurado exitosamente!');
  console.log('');
  console.log('📋 Próximos pasos:');
  console.log('- Los hooks de git están activos');
  console.log('- Ejecuta: npm run setup-hooks (opcional)');
  console.log('- Los commits ahora pasan por linting automático');
} catch (error) {
  console.error('❌ Error configurando Husky:', error.message);
  console.log('');
  console.log('💡 Solución alternativa:');
  console.log('- Ejecuta manualmente: npx husky init');
  console.log('- O instala husky: npm install husky --save-dev');
  process.exit(1);
}
