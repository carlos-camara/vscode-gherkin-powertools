import * as assert from 'assert';
import { logger } from '../../logger';

suite('Logger Test Suite', () => {
    let appendLineCalls: string[] = [];
    let originalAppendLine: any;
    let originalShow: any;
    let showCalled = false;

    setup(() => {
        appendLineCalls = [];
        showCalled = false;
        
        // Monkey patch the channel for testing
        const channel = (logger as any).channel;
        originalAppendLine = channel.appendLine;
        originalShow = channel.show;
        
        channel.appendLine = (msg: string) => appendLineCalls.push(msg);
        channel.show = () => { showCalled = true; };
    });

    teardown(() => {
        const channel = (logger as any).channel;
        channel.appendLine = originalAppendLine;
        channel.show = originalShow;
    });

    test('Logs info messages correctly', () => {
        logger.info('Test info message');
        assert.strictEqual(appendLineCalls.length, 1);
        assert.ok(appendLineCalls[0].includes('[INFO'));
        assert.ok(appendLineCalls[0].includes('Test info message'));
    });

    test('Logs error messages without error object', () => {
        logger.error('Test error message');
        assert.strictEqual(appendLineCalls.length, 1);
        assert.ok(appendLineCalls[0].includes('[ERROR'));
        assert.ok(appendLineCalls[0].includes('Test error message'));
    });

    test('Logs error messages with Error object', () => {
        const err = new Error('Something went wrong');
        err.stack = 'Mock stack trace';
        
        logger.error('Test error message', err);
        
        assert.strictEqual(appendLineCalls.length, 3);
        assert.ok(appendLineCalls[0].includes('Test error message'));
        assert.ok(appendLineCalls[1].includes('Something went wrong'));
        assert.ok(appendLineCalls[2].includes('Mock stack trace'));
    });

    test('Logs error messages with Error object without stack', () => {
        const err = new Error('No stack');
        err.stack = undefined;
        
        logger.error('Test error message', err);
        
        assert.strictEqual(appendLineCalls.length, 2);
        assert.ok(appendLineCalls[1].includes('No stack'));
    });

    test('Logs error messages with non-Error object', () => {
        logger.error('Test error message', { foo: 'bar' });
        
        assert.strictEqual(appendLineCalls.length, 2);
        assert.ok(appendLineCalls[1].includes('{"foo":"bar"}'));
    });

    test('Shows the output channel', () => {
        logger.show();
        assert.strictEqual(showCalled, true);
    });
});
