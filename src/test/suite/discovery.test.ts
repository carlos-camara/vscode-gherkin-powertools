import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { discoveryService } from '../../discovery';

suite('Discovery Service Test Suite', () => {
    let sandbox: sinon.SinonSandbox;

    setup(() => {
        sandbox = sinon.createSandbox();
    });

    teardown(() => {
        sandbox.restore();
    });

    test('Standard Behave layout detection', async () => {
        sandbox.stub(vscode.workspace, 'findFiles').resolves([
            vscode.Uri.file('/workspace/features/steps/login.py'),
            vscode.Uri.file('/workspace/features/steps/auth.py')
        ]);
        sandbox.stub(vscode.workspace, 'asRelativePath').callsFake((uri: string | vscode.Uri) => typeof uri === 'string' ? uri : uri.path.replace('/workspace/', ''));

        const layouts = await discoveryService.detectBehaveLayouts();
        
        assert.strictEqual(layouts.length, 1);
        assert.ok(layouts.includes('features/steps/**/*.py'));
    });

    test('Custom layout detection', async () => {
        sandbox.stub(vscode.workspace, 'findFiles').resolves([
            vscode.Uri.file('/workspace/e2e/steps/login.py')
        ]);
        sandbox.stub(vscode.workspace, 'asRelativePath').callsFake((uri: string | vscode.Uri) => typeof uri === 'string' ? uri : uri.path.replace('/workspace/', ''));

        const layouts = await discoveryService.detectBehaveLayouts();
        
        assert.strictEqual(layouts.length, 1);
        assert.ok(layouts.includes('e2e/steps/**/*.py'));
    });

    test('Multi-root workspace layout detection', async () => {
        sandbox.stub(vscode.workspace, 'findFiles').resolves([
            vscode.Uri.file('/workspace/folderA/features/steps/a.py'),
            vscode.Uri.file('/workspace/folderB/custom/steps/b.py')
        ]);
        sandbox.stub(vscode.workspace, 'asRelativePath').callsFake((uri: string | vscode.Uri) => {
            const path = typeof uri === 'string' ? uri : uri.path;
            if (path.includes('folderA')) return 'features/steps/a.py';
            if (path.includes('folderB')) return 'custom/steps/b.py';
            return '';
        });

        const layouts = await discoveryService.detectBehaveLayouts();
        
        assert.strictEqual(layouts.length, 2);
        assert.ok(layouts.includes('features/steps/**/*.py'));
        assert.ok(layouts.includes('custom/steps/**/*.py'));
    });

    test('Missing step directory', async () => {
        sandbox.stub(vscode.workspace, 'findFiles').resolves([]);
        const layouts = await discoveryService.detectBehaveLayouts();
        assert.strictEqual(layouts.length, 0);
    });

    test('Multiple candidate step directories', async () => {
        sandbox.stub(vscode.workspace, 'findFiles').resolves([
            vscode.Uri.file('/workspace/tests/e2e/steps/a.py'),
            vscode.Uri.file('/workspace/tests/integration/steps/b.py')
        ]);
        sandbox.stub(vscode.workspace, 'asRelativePath').callsFake((uri: string | vscode.Uri) => typeof uri === 'string' ? uri : uri.path.replace('/workspace/', ''));

        const layouts = await discoveryService.detectBehaveLayouts();
        
        assert.strictEqual(layouts.length, 2);
        assert.ok(layouts.includes('tests/e2e/steps/**/*.py'));
        assert.ok(layouts.includes('tests/integration/steps/**/*.py'));
    });
});
