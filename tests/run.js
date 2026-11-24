const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');
const m = html.match(/<script>([\s\S]*?)<\/script>/);
if (!m) { console.error('FAIL: в index.html нет <script>'); process.exit(1); }
const code = m[1];
if (/\beval\s*\(/.test(code) || /new\s+Function/.test(code)) {
  console.error('FAIL: запрещено использовать eval или new Function'); process.exit(1);
}
const ctx = { module: { exports: {} }, console, Math, Number };
vm.createContext(ctx);
try { vm.runInContext(code, ctx); } catch (e) { console.error('FAIL: ошибка скрипта:', e.message); process.exit(1); }
const evaluate = ctx.module.exports.evaluate;
if (typeof evaluate !== 'function') { console.error('FAIL: нет module.exports.evaluate'); process.exit(1); }

let fails = 0;
const eq = (expr, exp, mode = 'DEG') => {
  try {
    const r = evaluate(expr, mode);
    if (Math.abs(r - exp) < 1e-9) console.log('ok   ', expr, '=', exp);
    else { fails++; console.log('FAIL ', expr, 'ожидалось', exp, 'получено', r); }
  } catch (e) { fails++; console.log('FAIL ', expr, 'бросило ошибку:', e.message); }
};
const err = (expr, mode = 'DEG') => {
  try { const r = evaluate(expr, mode); fails++; console.log('FAIL ', expr, 'должно быть Error, получено', r); }
  catch (e) { console.log('ok   ', expr, '-> Error'); }
};
const neq = (expr, notExp, mode) => {
  try {
    const r = evaluate(expr, mode);
    if (Math.abs(r - notExp) > 1e-6) console.log('ok   ', expr, mode, '=', r);
    else { fails++; console.log('FAIL ', expr, mode, 'не должно быть', notExp); }
  } catch (e) { fails++; console.log('FAIL ', expr, mode, e.message); }
};

eq('2+3*4', 14);
eq('(2+3)*4', 20);
eq('2^10', 1024);
eq('sqrt(16)', 4);
eq('sin(30)', 0.5, 'DEG');
eq('log(100)', 2);
eq('5!', 120);
eq('0!', 1);
eq('-3+5', 2);
eq('2*(3+4)', 14);
eq('0.1+0.2', 0.3);
eq('pi', Math.PI);
eq('ln(e)', 1);
eq('log2(8)', 3);
eq('abs(-7)', 7);
eq('10/4', 2.5);
eq('2^3^2', 512);
err('1/0');
err('sqrt(-1)');
err('log(-5)');
err('171!');
err('2+');
err('(2+3');
neq('sin(30)', 0.5, 'RAD');

console.log(fails === 0 ? '\nALL PASSED' : '\nFAILED: ' + fails);
process.exit(fails === 0 ? 0 : 1);
