#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Simple bundle size analyzer
function analyzeBundleSize() {
  const distPath = './dist/assets';
  const fs = require('fs');
  const path = require('path');
  
  if (!fs.existsSync(distPath)) {
    console.error('No dist/assets directory found. Please build the project first.');
    process.exit(1);
  }
  
  const files = fs.readdirSync(distPath);
  const analysis = {
    totalSize: 0,
    files: [],
    timestamp: new Date().toISOString()
  };
  
  files.forEach(file => {
    const filePath = path.join(distPath, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isFile()) {
      const sizeInBytes = stats.size;
      const sizeInKB = (sizeInBytes / 1024).toFixed(2);
      const sizeInMB = (sizeInBytes / 1024 / 1024).toFixed(2);
      
      analysis.files.push({
        name: file,
        sizeInBytes,
        sizeInKB: parseFloat(sizeInKB),
        sizeInMB: parseFloat(sizeInMB),
        type: path.extname(file).substring(1)
      });
      
      analysis.totalSize += sizeInBytes;
    }
  });
  
  // Sort files by size (largest first)
  analysis.files.sort((a, b) => b.sizeInBytes - a.sizeInBytes);
  
  // Add totals
  analysis.totalSizeKB = (analysis.totalSize / 1024).toFixed(2);
  analysis.totalSizeMB = (analysis.totalSize / 1024 / 1024).toFixed(2);
  
  // Generate report
  console.log('\n=== Salina PDF Viewer Bundle Analysis ===\n');
  console.log(`Build Date: ${analysis.timestamp}`);
  console.log(`Total Bundle Size: ${analysis.totalSizeKB} KB (${analysis.totalSizeMB} MB)\n`);
  
  console.log('Files by size:');
  console.log('─'.repeat(60));
  
  analysis.files.forEach(file => {
    const percentage = ((file.sizeInBytes / analysis.totalSize) * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(percentage / 2));
    console.log(`${file.name.padEnd(30)} ${file.sizeInKB.toString().padStart(8)} KB ${bar} ${percentage}%`);
  });
  
  console.log('─'.repeat(60));
  
  // Check for common issues
  console.log('\n=== Recommendations ===\n');
  
  if (analysis.totalSize > 1024 * 1024) { // > 1MB
    console.log('⚠️  Total bundle size exceeds 1MB. Consider:');
    console.log('   - Code splitting for better loading performance');
    console.log('   - Lazy loading PDF.js components');
    console.log('   - Using dynamic imports for large dependencies');
  }
  
  const largeFiles = analysis.files.filter(f => f.sizeInBytes > 500 * 1024); // > 500KB
  if (largeFiles.length > 0) {
    console.log(`\n⚠️  ${largeFiles.length} file(s) exceed 500KB:`);
    largeFiles.forEach(file => {
      console.log(`   - ${file.name} (${file.sizeInKB} KB)`);
    });
  }
  
  // Save analysis to file
  const reportPath = './bundle-analysis.json';
  fs.writeFileSync(reportPath, JSON.stringify(analysis, null, 2));
  console.log(`\n✅ Full analysis saved to: ${reportPath}\n`);
}

// Run the analyzer
analyzeBundleSize();