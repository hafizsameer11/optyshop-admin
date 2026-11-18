const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'src', 'components', 'OrderModal.jsx');
const raw = fs.readFileSync(file, 'utf8');
const hadCrlf = raw.includes('\r\n');
let t = raw.replace(/\r\n/g, '\n');
const old = `                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-gray-700">{t('tax')}:</span>
                  <span className="font-semibold text-gray-900">€{parseFloat(orderData?.tax || 0).toFixed(2)}</span>
                </div>
`;
if (!t.includes(old)) {
  if (!t.includes("t('tax')")) {
    console.log('already gone');
  } else {
    console.error('MISSING');
    process.exit(1);
  }
} else {
  t = t.replace(old, '');
}
fs.writeFileSync(file, hadCrlf ? t.replace(/\n/g, '\r\n') : t);
console.log('OK');
