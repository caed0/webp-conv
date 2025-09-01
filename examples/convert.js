/**
 * @file convert.js
 * @description Example usage demonstrations for the webp-conv package
 * @author caed0
 * @version 2.1.2
 * 
 * This file contains various examples showing how to use the WebP converter
 * with different configurations, job objects, and conversion scenarios.
 */

const webpconv = require('../index.js');
const fs = require('fs');
const path = require('path');

/**
 * Example 1: Using job objects with custom settings
 * Demonstrates how to use job objects with different quality settings
 * and transparent color configurations for multiple files.
 * @async
 * @function example1
 * @returns {Promise<void>}
 */
async function example1() {
    console.log('Example 1: Job objects with custom settings');
    
    const converter = new webpconv({ quality: 80, transparent: '0x000000' });
    
    const jobs = [
        {
            input: 'examples/images/animated.webp',
            output: 'examples/images/output/animated-job.gif',
            settings: { quality: 100 }
        },
        {
            input: 'examples/images/animated-transparent.webp',
            output: 'examples/images/output/animated-transparent-job.gif',
            settings: { quality: 50, transparent: '0xFFFFFF' }
        },
        {
            input: 'examples/images/static.webp',
            output: 'examples/images/output/static-job.png'
        }
    ];
    
    try {
        const results = await converter.convertJobs(jobs);
        console.log('Conversion results:', results);
    } catch (error) {
        console.error('Conversion failed:', error.message);
    }
}

/**
 * Example 2: Auto-generated output paths
 * Shows how the converter automatically determines output format and path
 * based on input file type (animated → .gif, static → .png).
 * @async
 * @function example2
 * @returns {Promise<void>}
 */
async function example2() {
    console.log('\nExample 2: Auto-generated output paths');
    
    const converter = new webpconv();
    
    const jobs = [
        {
            input: 'examples/images/animated.webp',
            settings: { quality: 90 }
        },
        {
            input: 'examples/images/static.webp',
            settings: { quality: 95 }
        }
    ];
    
    try {
        const results = await converter.convertJobs(jobs);
        console.log('Auto-generated outputs:', results);
    } catch (error) {
        console.error('Conversion failed:', error.message);
    }
}

/**
 * Example 3: Single job object
 * Demonstrates processing a single job instead of an array.
 * @async
 * @function example3
 * @returns {Promise<void>}
 */
async function example3() {
    console.log('\nExample 3: Single job object');
    
    const converter = new webpconv();
    
    const singleJob = {
        input: 'examples/images/animated-transparent.webp',
        output: 'examples/images/output/single-job-output.gif',
        settings: { quality: 75, transparent: '0x00FF00' }
    };
    
    try {
        const result = await converter.convertJobs(singleJob);
        console.log('Single job result:', result);
    } catch (error) {
        console.error('Conversion failed:', error.message);
    }
}

/**
 * Example 4: Backward compatibility demonstration
 * Shows usage of the deprecated convert() method for backward compatibility.
 * @deprecated This example uses the deprecated convert() method
 * @async
 * @function example4
 * @returns {Promise<void>}
 */
async function example4() {
    console.log('\nExample 4: Backward compatibility (DEPRECATED METHOD)');
    console.log('Note: The convert() method is deprecated. Use convertJobs() instead.');
    
    const converter = new webpconv();
    
    try {
        const result = await converter.convert(
            'examples/images/static.webp',
            'examples/images/output/backward-compatible.png',
            { quality: 85 }
        );
        console.log('Backward compatible result:', result);
    } catch (error) {
        console.error('Conversion failed:', error.message);
    }
}

/**
 * Main function to run all examples and create output directory
 * Creates the output directory if it doesn't exist and runs all example functions.
 * @async
 * @function runExamples
 * @returns {Promise<void>}
 */
async function runExamples() {
    const outputDir = path.join(__dirname, 'images', 'output');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    await example1();
    await example2();
    await example3();
    await example4();
}

runExamples().catch(console.error);
