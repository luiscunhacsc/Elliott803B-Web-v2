class ConsoleUI {
    constructor(emulator) {
        this.emulator = emulator;
        this.buttons = new Map();

        // Configuration for the 4 rows
        // Bit mapping 803B Word (39 bits):
        // F1: 38-33
        // N1: 32-20
        // B: 19
        // F2: 18-13
        // N2: 12-0
        this.rows = [
            {
                id: 'row-f1',
                type: 'function',
                startBit: 33,
                groups: [
                    { labels: [4, 2, 1] }, // Bits 38, 37, 36
                    { labels: [4, 2, 1] }  // Bits 35, 34, 33
                ]
            },
            {
                id: 'row-n1',
                type: 'address',
                startBit: 20,
                labels: [4096, 2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1],
                hasB: true
            },
            {
                id: 'row-f2',
                type: 'function',
                startBit: 13,
                groups: [
                    { labels: [4, 2, 1] }, // Bits 18, 17, 16
                    { labels: [4, 2, 1] }  // Bits 15, 14, 13
                ]
            },
            {
                id: 'row-n2',
                type: 'address',
                startBit: 0,
                labels: [4096, 2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1],
                hasB: false
            }
        ];

        console.log("ConsoleUI: Instantiated.");
        this.init();
    }

    // ... init / generateButtonsAndBind ...

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.generateButtonsAndBind();
            });
        } else {
            this.generateButtonsAndBind();
        }
    }

    generateButtonsAndBind() {
        try {
            this.createWordGeneratorButtons();
            console.log("ConsoleUI: Buttons generated.");
        } catch (e) {
            console.error("ConsoleUI: Error generating buttons", e);
            alert(`ConsoleUI Generation Error: ${e.message}`);
        }

        // Re-bind controls if they weren't handled by main.js, 
        // but main.js handles them now. 
        // We can add extra visual feedback handlers here if needed.
        this.bindVisuals();
    }

    createWordGeneratorButtons() {
        this.rows.forEach(row => {
            const container = document.getElementById(row.id);
            if (!container) return;

            // 1. Red "Clear" Button
            const clearBtn = this.createButton('red', '', 'CLR');
            clearBtn.title = "Clear Row";
            clearBtn.addEventListener('click', () => {
                // Clear all bits in this row
                // This requires iterating buttons or blindly clearing range in HW?
                // For now, toggle visual off for all in row and clear HW bits
                // Hard to do without keeping refs. 
                // Let's implement individual bits first.
            });
            container.appendChild(clearBtn);

            this.createGap(container);

            if (row.type === 'function') {
                // Function Rows (F1, F2)
                // Groups are High to Low magnitude? 
                // Reference: F1 (38-33). Group 0 (38,37,36), Group 1 (35,34,33).
                // Labels [4,2,1].
                // In binary 4=100 (Bit 2), 2=010 (Bit 1), 1=001 (Bit 0).
                // So Group 0 Label 4 is Bit 38? 
                // Group 0 Label 1 is Bit 36?
                // High bit is Left.

                let currentBit = row.startBit + 5; // Start at top bit of 6-bit field

                row.groups.forEach((group, gIdx) => {
                    group.labels.forEach((label) => {
                        // Determine bit offset from label? 
                        // No, iteration order is 4, 2, 1 (High to Low bit).
                        let bit = currentBit;
                        this.createBitButton(container, label, bit);
                        currentBit--;
                    });
                    if (gIdx < row.groups.length - 1) this.createGap(container, '15px');
                });
            } else {
                // Address Rows (N1, N2)
                // Labels 4096...1 (High to Low).
                // 4096 is bit 12. 1 is bit 0.
                // row.startBit is 20 (for N1) or 0 (for N2).
                // N1: 4096 (Bit 32) -> 1 (Bit 20).
                // 4096 = 2^12. Bit relative to start is 12.
                // Total bit = startBit + 12.

                row.labels.forEach(label => {
                    let relBit = Math.log2(label);
                    let bit = row.startBit + relBit;
                    this.createBitButton(container, label, bit);
                });
            }

            // B Button
            if (row.hasB) {
                this.createGap(container);
                this.createBitButton(container, 'B', 19, 'red');
            }
        });
    }

    createGap(container, width = '30px') {
        const gap = document.createElement('div');
        gap.className = 'wg-gap';
        gap.style.width = width;
        gap.style.minWidth = width;
        container.appendChild(gap);
    }

    createBitButton(container, label, bitIndex, color = 'black') {
        const btn = this.createButton(color, label, bitIndex);
        btn.dataset.bit = bitIndex;

        btn.addEventListener('click', (e) => {
            // Check state
            const isActive = btn.classList.contains('active');
            // Update HW (Toggle happening in createButton listener? No, we handle it explicitly or allow CreateButton to toggle)
            // CreateButton toggles 'active' class on click.
            // So here we read the NEW state (after toggle? or before?)
            // createButton listener runs... when? 
            // Currently createButton adds a listener that toggles class.
            // If we add another listener, it runs in order.

            // To avoid race/confusion, let's sync inside.
            // But 'createButton' is generic.

            // NOTE: createButton implementation below toggles class.
            // We need to sync with that.
            // Let's assume class toggle happened.
            // Wait, standard DOM event order: listeners fire in order.
            // If createButton implementation is reused, I should verify constraints.
        });

        // Override the generic listener? Or rely on it?
        // Let's modify createButton to accept a callback or handle logic here by NOT using generic listener for logic.

        container.appendChild(btn);
    }

    createButton(color, label, idSuffix) {
        const btn = document.createElement('button');
        btn.className = `wg-btn ${color === 'red' ? 'red-btn' : ''}`;
        btn.style.width = "36px";
        btn.style.height = "36px";
        btn.style.display = "block";

        if (label !== undefined && label !== null && label !== '') {
            const span = document.createElement('span');
            span.className = 'wg-sublabel';
            span.textContent = label.toString();
            btn.appendChild(span);
        }

        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            btn.classList.toggle('btn-pressed');

            // Hardware Sync
            const bit = btn.dataset.bit;
            if (bit !== undefined) {
                const isActive = btn.classList.contains('active');
                if (window.elliott && window.elliott.console) {
                    window.elliott.console.setWordGenBit(parseInt(bit), isActive);
                }
            }
            console.log(`WG Button Clicked: ${label} (Bit ${bit})`);
        });

        return btn;
    }

    bindVisuals() {
        // Momentary 'push' buttons: show pressed state only while held down
        // Per the 803B manual: Operate Bar and System Reset are 'push' (momentary)
        // Read, Normal, Obey are 'interlocked' — their active state is managed by main.js
        const momentaryIds = [
            'btn-batt-on', 'btn-batt-off', 'btn-comp-on', 'btn-comp-off',
            'btn-reset', 'btn-read', 'btn-normal', 'btn-obey', 'operate-bar'
        ];

        momentaryIds.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('mousedown', () => btn.classList.add('btn-pressed'));
                btn.addEventListener('mouseup', () => btn.classList.remove('btn-pressed'));
                btn.addEventListener('mouseleave', () => btn.classList.remove('btn-pressed'));
            }
        });

        // Push-push (latch) buttons manage their own 'active' class via main.js;
        // add only the physical press animation here.
        const latchIds = ['btn-clear-store', 'btn-manual-data', 'btn-select-stop'];
        latchIds.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('mousedown', () => btn.classList.add('btn-pressed'));
                btn.addEventListener('mouseup', () => btn.classList.remove('btn-pressed'));
                btn.addEventListener('mouseleave', () => btn.classList.remove('btn-pressed'));
            }
        });
    }

    updateLights(cpu) {
        const setLight = (id, state) => {
            const el = document.getElementById(id);
            if (el) {
                if (state) el.classList.add('active');
                else el.classList.remove('active');
            }
        };

        if (cpu) {
            setLight('light-parity', false);
            setLight('light-block', false);
            setLight('light-busy', cpu.busy);
            setLight('light-fp-overflow', cpu.fpOverflow);
            setLight('light-step', cpu.stopped);
            setLight('light-overflow', cpu.overflow);
        }
    }
}

// Export to global scope
window.ConsoleUI = ConsoleUI;
