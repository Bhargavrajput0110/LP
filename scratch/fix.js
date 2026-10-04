const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

const toastFunc = `        }

        // -------------------------------------------------------------
        // UI HELPERS
        // -------------------------------------------------------------
        window.showLPToast = function(msg) {
            let toast = document.getElementById('lp-toast');
            if (!toast) {
                toast = document.createElement('div');
                toast.id = 'lp-toast';
                toast.style.cssText = 'position:fixed;bottom:20px;right:20px;background:rgba(20,20,20,0.95);color:#fff;padding:12px 24px;border:1px solid rgba(255,255,255,0.1);border-radius:4px;z-index:9999;font-family:Inter,sans-serif;font-size:12px;opacity:0;transition:opacity 0.3s;pointer-events:none;';
                document.body.appendChild(toast);
            }
            toast.textContent = msg;
            toast.style.opacity = '1';
            setTimeout(() => { toast.style.opacity = '0'; }, 3000);
        };`;

code = code.replace('        }', toastFunc);

const catchBlock = `                } catch(e) { 
                    console.warn('[LP] Fragment load failed:', name, e); 
                    if(window.showLPToast) window.showLPToast('Content failed to load. Please try again.');
                }`;

code = code.replace("                } catch(e) { console.warn('[LP] Fragment load failed:', name, e); }", catchBlock);

fs.writeFileSync('main.js', code, 'utf8');
console.log('main.js updated successfully');
