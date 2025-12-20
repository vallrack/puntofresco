// Ejecuta: node scripts/verify-env.js

require('dotenv').config({ path: '.env.local' });

console.log('🔍 Verificando variables de entorno...\n');

const vars = {
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID': process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET': process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  'FIREBASE_CLIENT_EMAIL': process.env.FIREBASE_CLIENT_EMAIL,
  'FIREBASE_PRIVATE_KEY': process.env.FIREBASE_PRIVATE_KEY,
};

let allGood = true;

for (const [key, value] of Object.entries(vars)) {
  const exists = !!value;
  const icon = exists ? '✅' : '❌';
  
  if (!exists) {
    allGood = false;
    console.log(`${icon} ${key}: NO DEFINIDA`);
  } else {
    const preview = key === 'FIREBASE_PRIVATE_KEY' 
      ? value.substring(0, 50) + '...' 
      : value;
    console.log(`${icon} ${key}: ${preview}`);
  }
}

console.log('\n' + (allGood ? '✅ Todo correcto!' : '❌ Faltan variables'));

if (vars.FIREBASE_PRIVATE_KEY) {
  const hasNewlines = vars.FIREBASE_PRIVATE_KEY.includes('\\n');
  console.log('\n🔍 FIREBASE_PRIVATE_KEY tiene \\n:', hasNewlines ? '✅ SÍ' : '❌ NO');
  
  if (!hasNewlines) {
    console.log('⚠️  ADVERTENCIA: El PRIVATE_KEY debe contener \\n para los saltos de línea');
  }
}
