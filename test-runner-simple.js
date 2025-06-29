// WSL2環境用シンプルテストランナー

const fs = require('fs');
const path = require('path');

console.log('🧪 Marketing Agent - Simple Test Runner\n');

// テスト結果の統計
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// テスト関数の実装
function describe(testSuite, testFunction) {
  console.log(`📋 ${testSuite}`);
  testFunction();
  console.log('');
}

function it(testName, testFunction) {
  totalTests++;
  try {
    testFunction();
    console.log(`  ✅ ${testName}`);
    passedTests++;
  } catch (error) {
    console.log(`  ❌ ${testName}`);
    console.log(`     Error: ${error.message}`);
    failedTests++;
  }
}

function expect(actual) {
  return {
    toBe: (expected) => {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, but got ${actual}`);
      }
    },
    toEqual: (expected) => {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
      }
    },
    toHaveProperty: (property, value) => {
      if (!(property in actual)) {
        throw new Error(`Expected object to have property '${property}'`);
      }
      if (value !== undefined && actual[property] !== value) {
        throw new Error(`Expected property '${property}' to be ${value}, but got ${actual[property]}`);
      }
    },
    toContain: (expected) => {
      if (!actual.includes(expected)) {
        throw new Error(`Expected '${actual}' to contain '${expected}'`);
      }
    },
    toHaveLength: (expected) => {
      if (actual.length !== expected) {
        throw new Error(`Expected length ${expected}, but got ${actual.length}`);
      }
    },
    toBeDefined: () => {
      if (actual === undefined) {
        throw new Error('Expected value to be defined');
      }
    }
  };
}

// グローバルに関数を設定
global.describe = describe;
global.it = it;
global.expect = expect;

// 基本的なAIエージェントテスト
describe('AIエージェント基本機能テスト', () => {
  it('環境変数が正しく設定されている', () => {
    const envExists = fs.existsSync('.env');
    expect(envExists).toBe(true);
    
    // .envファイルの内容をチェック
    const envContent = fs.readFileSync('.env', 'utf8');
    expect(envContent).toContain('GEMINI_API_KEY');
  });

  it('package.jsonに必要な依存関係が含まれている', () => {
    const packageJsonPath = path.join(__dirname, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    expect(packageJson.dependencies).toHaveProperty('@prisma/client');
    expect(packageJson.dependencies).toHaveProperty('next');
    expect(packageJson.dependencies).toHaveProperty('react');
    expect(packageJson.devDependencies).toHaveProperty('jest');
    expect(packageJson.devDependencies).toHaveProperty('@testing-library/react');
  });

  it('Prismaスキーマが存在する', () => {
    const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
    const schemaExists = fs.existsSync(schemaPath);
    expect(schemaExists).toBe(true);
    
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    expect(schemaContent).toContain('model Workflow');
    expect(schemaContent).toContain('model Agent');
  });

  it('AIエージェントファイルが存在する', () => {
    const agentFiles = [
      'app/lib/agents/base.ts',
      'app/lib/agents/market-research.ts',
      'app/lib/agents/content-scraping.ts',
      'app/lib/agents/nlp-classification.ts'
    ];

    agentFiles.forEach(file => {
      const filePath = path.join(__dirname, file);
      const fileExists = fs.existsSync(filePath);
      expect(fileExists).toBe(true);
    });
  });

  it('APIルートが存在する', () => {
    const apiRoutes = [
      'app/api/workflows/route.ts',
      'app/api/health/route.ts'
    ];

    apiRoutes.forEach(route => {
      const routePath = path.join(__dirname, route);
      const routeExists = fs.existsSync(routePath);
      expect(routeExists).toBe(true);
    });
  });

  it('UIコンポーネントが存在する', () => {
    const components = [
      'app/components/workflow-list.tsx',
      'app/components/create-workflow-modal.tsx',
      'app/page.tsx'
    ];

    components.forEach(component => {
      const componentPath = path.join(__dirname, component);
      const componentExists = fs.existsSync(componentPath);
      expect(componentExists).toBe(true);
    });
  });
});

describe('設定ファイルテスト', () => {
  it('TypeScript設定が正しい', () => {
    const tsconfigPath = path.join(__dirname, 'tsconfig.json');
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    
    expect(tsconfig.compilerOptions).toHaveProperty('target');
    expect(tsconfig.compilerOptions).toHaveProperty('paths');
    expect(tsconfig.compilerOptions.paths).toHaveProperty('@/*');
  });

  it('Next.js設定が存在する', () => {
    const nextConfigPath = path.join(__dirname, 'next.config.js');
    const nextConfigExists = fs.existsSync(nextConfigPath);
    expect(nextConfigExists).toBe(true);
  });

  it('Jest設定が正しい', () => {
    const jestConfigPath = path.join(__dirname, 'jest.config.js');
    const jestConfigExists = fs.existsSync(jestConfigPath);
    expect(jestConfigExists).toBe(true);
  });
});

describe('データベーステスト', () => {
  it('データベースファイルが存在する', () => {
    const dbPath = path.join(__dirname, 'prisma', 'dev.db');
    const dbExists = fs.existsSync(dbPath);
    expect(dbExists).toBe(true);
  });

  it('マイグレーションファイルが存在する', () => {
    const migrationsDir = path.join(__dirname, 'prisma', 'migrations');
    const migrationsExists = fs.existsSync(migrationsDir);
    expect(migrationsExists).toBe(true);
  });
});

// テスト実行結果の表示
setTimeout(() => {
  console.log('📊 テスト結果');
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ 成功: ${passedTests}/${totalTests}`);
  console.log(`❌ 失敗: ${failedTests}/${totalTests}`);
  console.log(`📈 成功率: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (failedTests === 0) {
    console.log('\n🎉 すべてのテストが成功しました！');
  } else {
    console.log('\n⚠️  一部のテストが失敗しています。');
  }
  
  console.log(`\n⏱️  実行時間: ${Date.now() - startTime}ms`);
}, 100);

const startTime = Date.now();