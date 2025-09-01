const webpconv = require('../index.js');



// Example 1: Using job objects with custom settings
async function example1() {
    console.log('Example 1: Job objects with custom settings');
    
    const converter = new webpconv({ quality: 80, transparent: '0x000000' }); // Default settings
    
    const jobs = [
        {
            input: 'examples/images/animated.webp',
            output: 'examples/images/output/animated-job.gif',
            settings: { quality: 100 } // Override default quality for this job
        },
        {
            input: 'examples/images/animated-transparent.webp',
            output: 'examples/images/output/animated-transparent-job.gif',
            settings: { quality: 50, transparent: '0xFFFFFF' } // Custom settings
        },
        {
            input: 'examples/images/static.webp',
            output: 'examples/images/output/static-job.png'
            // Uses default settings from converter
        }
    ];
    
    try {
        const results = await converter.convertJobs(jobs);
        console.log('Conversion results:', results);
    } catch (error) {
        console.error('Conversion failed:', error.message);
    }
}

// Example 2: Auto-generated output paths
async function example2() {
    console.log('\nExample 2: Auto-generated output paths');
    
    const converter = new webpconv();
    
    const jobs = [
        {
            input: 'examples/images/animated.webp',
            settings: { quality: 90 }
            // Output will be auto-generated as 'examples/images/animated.gif'
        },
        {
            input: 'examples/images/static.webp',
            settings: { quality: 95 }
            // Output will be auto-generated as 'examples/images/static.png'
        }
    ];
    
    try {
        const results = await converter.convertJobs(jobs);
        console.log('Auto-generated outputs:', results);
    } catch (error) {
        console.error('Conversion failed:', error.message);
    }
}

// Example 3: Single job object
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

// Example 4: Backward compatibility - original convert method (DEPRECATED)
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

// Run all examples
async function runExamples() {
    await example1();
    await example2();
    await example3();
    await example4();
}

runExamples().catch(console.error);
