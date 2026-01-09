import fs from 'fs';
import path from 'path';

async function testPDF() {
  const pdfPath = path.join(process.cwd(), 'информация', 'Easy chek.pdf');
  
  try {
    // Пробуем разные способы импорта
    let pdfParse: any;
    
    // Способ 1: require
    try {
      pdfParse = require('pdf-parse');
      console.log('1. require успешен, тип:', typeof pdfParse);
      if (pdfParse.default) {
        console.log('   Есть default:', typeof pdfParse.default);
        pdfParse = pdfParse.default;
      }
    } catch (e) {
      console.log('1. require не сработал:', e);
    }
    
    // Способ 2: динамический импорт
    if (typeof pdfParse !== 'function') {
      try {
        const module = await import('pdf-parse');
        console.log('2. import успешен, тип:', typeof module);
        pdfParse = module.default || module;
        console.log('   После default, тип:', typeof pdfParse);
      } catch (e) {
        console.log('2. import не сработал:', e);
      }
    }
    
    // Пробуем использовать как функцию напрямую
    if (typeof pdfParse === 'function') {
      console.log('✅ pdf-parse это функция!');
      const dataBuffer = fs.readFileSync(pdfPath);
      console.log('📄 Размер файла:', dataBuffer.length, 'байт');
      const data = await pdfParse(dataBuffer);
      console.log('✅ Успешно извлечено:', data.text.length, 'символов');
      console.log('Первые 200 символов:', data.text.substring(0, 200));
    } else {
      console.log('❌ pdf-parse не является функцией, тип:', typeof pdfParse);
      console.log('Содержимое:', Object.keys(pdfParse));
      
      // Пробуем использовать require в другом контексте
      console.log('\nПробую альтернативный способ...');
      const pdf = require('pdf-parse');
      console.log('Тип после require:', typeof pdf);
      
      // Пробуем вызвать как функцию
      try {
        const dataBuffer = fs.readFileSync(pdfPath);
        console.log('Пробую вызвать как функцию...');
        const data = await pdf(dataBuffer);
        console.log('✅ УСПЕХ! Извлечено:', data.text.length, 'символов');
        console.log('Первые 200 символов:', data.text.substring(0, 200));
      } catch (e: any) {
        console.log('❌ Ошибка при вызове:', e.message);
      }
    }
  } catch (error: any) {
    console.error('❌ Ошибка:', error.message);
    console.error('Stack:', error.stack);
  }
}

testPDF();

