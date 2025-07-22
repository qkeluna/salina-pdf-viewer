const fs = require('fs');
const path = require('path');

function analyzeBundleSize() {
  const distPath = './dist/assets';
  
  if (!fs.existsSync(distPath)) {
    console.error('No dist/assets directory found.');
    return;
  }
  
  const files = fs.readdirSync(distPath);
  let totalSize = 0;
  const fileAnalysis = [];
  
  files.forEach(file => {
    const filePath = path.join(distPath, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isFile()) {
      const sizeInBytes = stats.size;
      const sizeInKB = (sizeInBytes / 1024).toFixed(2);
      
      fileAnalysis.push({
        name: file,
        sizeInBytes,
        sizeInKB: parseFloat(sizeInKB),
        type: path.extname(file).substring(1)
      });
      
      totalSize += sizeInBytes;
    }
  });
  
  fileAnalysis.sort((a, b) => b.sizeInBytes - a.sizeInBytes);
  const totalSizeKB = (totalSize / 1024).toFixed(2);
  const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
  
  console.log('\n=== Salina PDF Viewer Bundle Analysis ===\n');
  console.log(`Total Bundle Size: ${totalSizeKB} KB (${totalSizeMB} MB)\n`);
  
  console.log('Files by size:');
  console.log('─'.repeat(60));
  
  fileAnalysis.forEach(file => {
    const percentage = ((file.sizeInBytes / totalSize) * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(percentage / 2));
    console.log(`${file.name.padEnd(30)} ${file.sizeInKB.toString().padStart(8)} KB ${bar} ${percentage}%`);
  });
  
  console.log('─'.repeat(60));
  
  // Recommendations
  console.log('\n=== Bundle Analysis & Recommendations ===\n');
  
  if (totalSize > 1024 * 1024) { // > 1MB
    console.log('⚠️  Total bundle size exceeds 1MB. Consider:');
    console.log('   - Code splitting for better loading performance');
    console.log('   - Lazy loading PDF.js components');
    console.log('   - Using dynamic imports for large dependencies');
  } else if (totalSize > 500 * 1024) { // > 500KB
    console.log('⚠️  Bundle size is above 500KB. Monitor for growth.');
  } else {
    console.log('✅ Bundle size is reasonable for a PDF viewer library.');
  }
  
  const largeFiles = fileAnalysis.filter(f => f.sizeInBytes > 200 * 1024); // > 200KB
  if (largeFiles.length > 0) {
    console.log(`\n📊 Large files (>200KB):`);
    largeFiles.forEach(file => {
      console.log(`   - ${file.name} (${file.sizeInKB} KB)`);
      if (file.name.includes('index') && file.type === 'js') {
        console.log('     → Main application bundle (includes React + PDF viewer)');
      } else if (file.name.includes('pdfjs')) {
        console.log('     → PDF.js library chunk');
      }
    });
  }
  
  // File type breakdown
  const typeBreakdown = {};
  fileAnalysis.forEach(file => {
    if (!typeBreakdown[file.type]) {
      typeBreakdown[file.type] = { count: 0, size: 0 };
    }
    typeBreakdown[file.type].count++;
    typeBreakdown[file.type].size += file.sizeInBytes;
  });
  
  console.log('\n📂 File type breakdown:');
  Object.entries(typeBreakdown).forEach(([type, data]) => {
    const sizeKB = (data.size / 1024).toFixed(2);
    const percentage = ((data.size / totalSize) * 100).toFixed(1);
    console.log(`   ${type.toUpperCase()}: ${data.count} file(s), ${sizeKB} KB (${percentage}%)`);
  });
  
  return { totalSizeKB, totalSizeMB, fileAnalysis, typeBreakdown };
}

// Run the analysis
const result = analyzeBundleSize();

// Save detailed analysis to JSON
if (result) {
  const analysis = {
    timestamp: new Date().toISOString(),
    ...result
  };
  
  fs.writeFileSync('./bundle-analysis.json', JSON.stringify(analysis, null, 2));
  console.log('\n✅ Detailed analysis saved to: bundle-analysis.json\n');
}