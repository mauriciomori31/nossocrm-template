#!/usr/bin/env node

/**
 * Script de validação pós-setup
 * Verifica se todas as configurações estão corretas
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const REQUIRED_ENV_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

console.log('🔍 Validando setup do NossoCRM...\n');

// 1. Verifica env vars
console.log('1️⃣ Verificando variáveis de ambiente...');
const missingVars = REQUIRED_ENV_VARS.filter(v => !process.env[v]);

if (missingVars.length > 0) {
  console.error('❌ Variáveis faltando:', missingVars.join(', '));
  console.error('\nConfigure no arquivo .env ou nas variáveis do Vercel');
  process.exit(1);
}
console.log('✅ Variáveis de ambiente OK\n');

// 2. Testa conexão com Supabase
console.log('2️⃣ Testando conexão com Supabase...');
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

try {
  const { data, error } = await supabase.from('companies').select('count').limit(1);

  if (error) {
    console.error('❌ Erro ao conectar:', error.message);
    console.error('\nPossíveis causas:');
    console.error('- Migrations não rodaram ainda');
    console.error('- Chaves do Supabase incorretas');
    console.error('- Tabela "companies" não existe');
    process.exit(1);
  }

  console.log('✅ Conexão com Supabase OK\n');
} catch (err) {
  console.error('❌ Erro de rede:', err.message);
  process.exit(1);
}

// 3. Verifica se instance está inicializada
console.log('3️⃣ Verificando inicialização...');
try {
  const { data, error } = await supabase.rpc('is_instance_initialized');

  if (error) {
    console.warn('⚠️  RPC is_instance_initialized não encontrada');
    console.warn('   Sistema pode não estar totalmente configurado\n');
  } else if (data === true) {
    console.log('✅ Instância já inicializada\n');
  } else {
    console.log('⚠️  Instância não inicializada');
    console.log('   Acesse /setup para criar a primeira empresa\n');
  }
} catch (err) {
  console.warn('⚠️  Não foi possível verificar inicialização\n');
}

// 4. Verifica Custom Access Token Hook (opcional)
console.log('4️⃣ Verificando Custom Access Token Hook (opcional)...');
console.log('ℹ️  Esta é uma otimização de performance');
console.log('ℹ️  O sistema funciona sem ela, mas fica mais rápido com');
console.log('\n📖 Para ativar:');
console.log('   1. Acesse Supabase Dashboard');
console.log('   2. Authentication → Hooks');
console.log('   3. Custom Access Token → custom_access_token_hook');
console.log('   4. Save\n');

console.log('✅ Setup validado com sucesso! 🎉\n');
console.log('Próximos passos:');
console.log('- Execute: npm run dev');
console.log('- Acesse: http://localhost:3003');
console.log('- Se necessário, vá em /setup para criar sua empresa\n');
