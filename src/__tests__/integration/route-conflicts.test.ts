/**
 * Route Conflict Detection Test
 *
 * This test ensures that there are no duplicate routes between:
 * - Pages Router (src/pages/api/)
 * - App Router (src/app/api/)
 *
 * Next.js throws warnings and can cause 500 errors when routes conflict.
 * This test catches such issues before deployment.
 */

import fs from 'fs';
import path from 'path';

interface RouteInfo {
  path: string;
  filePath: string;
  router: 'pages' | 'app';
}

/**
 * Recursively scans a directory for API route files
 */
function scanApiRoutes(
  baseDir: string,
  routerType: 'pages' | 'app',
  currentPath: string = ''
): RouteInfo[] {
  const routes: RouteInfo[] = [];
  const fullPath = path.join(baseDir, currentPath);

  if (!fs.existsSync(fullPath)) {
    return routes;
  }

  const entries = fs.readdirSync(fullPath, { withFileTypes: true });

  for (const entry of entries) {
    const relativePath = path.join(currentPath, entry.name);
    const absolutePath = path.join(fullPath, entry.name);

    if (entry.isDirectory()) {
      // Skip test directories and node_modules
      if (entry.name === '__tests__' || entry.name === 'node_modules') {
        continue;
      }
      // Recursively scan subdirectories
      routes.push(...scanApiRoutes(baseDir, routerType, relativePath));
    } else if (entry.isFile()) {
      // Only process TypeScript files
      if (!entry.name.endsWith('.ts') && !entry.name.endsWith('.tsx')) {
        continue;
      }

      // Skip test files
      if (entry.name.includes('.test.') || entry.name.includes('.spec.')) {
        continue;
      }

      // Convert file path to route path
      let routePath = relativePath;

      // Remove file extension
      routePath = routePath.replace(/\.(ts|tsx)$/, '');

      // Pages Router: index.ts → /
      // App Router: route.ts → /
      if (entry.name === 'index.ts' || entry.name === 'index.tsx') {
        routePath = routePath.replace(/\/index$/, '');
      } else if (entry.name === 'route.ts' || entry.name === 'route.tsx') {
        routePath = routePath.replace(/\/route$/, '');
      }

      // Normalize to API route format (/api/...)
      if (!routePath.startsWith('/')) {
        routePath = '/' + routePath;
      }

      routes.push({
        path: routePath,
        filePath: absolutePath,
        router: routerType,
      });
    }
  }

  return routes;
}

describe('Route Conflict Detection', () => {
  const projectRoot = path.resolve(__dirname, '../../..');
  const pagesApiDir = path.join(projectRoot, 'src/pages/api');
  const appApiDir = path.join(projectRoot, 'src/app/api');

  let pagesRoutes: RouteInfo[] = [];
  let appRoutes: RouteInfo[] = [];
  let allRoutes: RouteInfo[] = [];

  beforeAll(() => {
    // Scan both directories
    pagesRoutes = scanApiRoutes(pagesApiDir, 'pages');
    appRoutes = scanApiRoutes(appApiDir, 'app');
    allRoutes = [...pagesRoutes, ...appRoutes];
  });

  test('should detect Pages Router API routes', () => {
    console.log('\n📂 Pages Router routes found:');
    if (pagesRoutes.length === 0) {
      console.log('  (none)');
    } else {
      pagesRoutes.forEach((route) => {
        console.log(`  ${route.path} → ${route.filePath}`);
      });
    }
    // This test always passes - just for visibility
    expect(pagesRoutes).toBeDefined();
  });

  test('should detect App Router API routes', () => {
    console.log('\n📂 App Router routes found:');
    if (appRoutes.length === 0) {
      console.log('  (none)');
    } else {
      appRoutes.forEach((route) => {
        console.log(`  ${route.path} → ${route.filePath}`);
      });
    }
    // This test always passes - just for visibility
    expect(appRoutes).toBeDefined();
  });

  test('should NOT have duplicate routes between Pages and App Router', () => {
    // Group routes by path
    const routesByPath = new Map<string, RouteInfo[]>();

    for (const route of allRoutes) {
      if (!routesByPath.has(route.path)) {
        routesByPath.set(route.path, []);
      }
      routesByPath.get(route.path)!.push(route);
    }

    // Find duplicates
    const duplicates = Array.from(routesByPath.entries()).filter(
      ([_, routes]) => routes.length > 1
    );

    if (duplicates.length > 0) {
      console.error('\n❌ Duplicate routes detected:');
      duplicates.forEach(([routePath, routes]) => {
        console.error(`\n  Route: ${routePath}`);
        routes.forEach((route) => {
          console.error(`    - ${route.router} router: ${route.filePath}`);
        });
      });

      console.error('\n⚠️  Next.js does not allow duplicate routes.');
      console.error(
        '   This will cause warnings and 500 errors during runtime.'
      );
      console.error('\n💡 Solution: Remove one of the duplicate route files.');
      console.error(
        '   Recommendation: Keep App Router (src/app/api/), remove Pages Router (src/pages/api/)'
      );
    }

    // Fail test if duplicates found
    expect(duplicates).toHaveLength(0);
  });

  test('should validate route naming conventions', () => {
    const invalidRoutes: RouteInfo[] = [];

    for (const route of appRoutes) {
      const fileName = path.basename(route.filePath);
      // App Router should use route.ts, not index.ts
      if (fileName === 'index.ts' || fileName === 'index.tsx') {
        invalidRoutes.push(route);
      }
    }

    if (invalidRoutes.length > 0) {
      console.warn('\n⚠️  App Router routes using incorrect naming:');
      invalidRoutes.forEach((route) => {
        console.warn(`  ${route.path} → ${route.filePath}`);
        console.warn('    Expected: route.ts, Found: index.ts');
      });
    }

    // This is a warning, not a hard failure
    expect(invalidRoutes).toHaveLength(0);
  });

  test('should recommend migration strategy if Pages Router routes exist', () => {
    if (pagesRoutes.length > 0 && appRoutes.length > 0) {
      console.log('\n📋 Migration Recommendation:');
      console.log('  This project uses both Pages Router and App Router.');
      console.log('  App Router is the modern Next.js approach.');
      console.log('\n  Suggested migration steps:');
      console.log('  1. Verify App Router routes have feature parity');
      console.log('  2. Remove Pages Router routes (src/pages/api/)');
      console.log('  3. Test endpoints to ensure they work');
      console.log('  4. Update any hardcoded URLs in client code');
    }

    // This test always passes - just informational
    expect(true).toBe(true);
  });
});
