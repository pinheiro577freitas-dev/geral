document.addEventListener('DOMContentLoaded', () => {
    const crimesGrid = document.getElementById('crimesGrid');
    const crimeSearch = document.getElementById('crimeSearch');
    const categoryNav = document.getElementById('categoryNav');
    const commsBtn = document.getElementById('commsBtn');
    const themeToggleBtn = document.getElementById('themeToggle');
    const logoImage = document.getElementById('logoImage');
    const commsView = document.getElementById('commsView');
    const crimesView = document.getElementById('crimesView');
    const selectedCrimesList = document.getElementById('selectedCrimes');
    const totalFineEl = document.getElementById('totalFine');
    const totalJailEl = document.getElementById('totalJail');
    const clearAllBtn = document.getElementById('clearAll');
    const generateTicketBtn = document.getElementById('generateTicket');
    const extraNotesArea = document.getElementById('extraNotes');

    // Modal elements
    const configModal = document.getElementById('configModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const saveModalBtn = document.getElementById('saveModal');
    const cancelModalBtn = document.getElementById('cancelModal');

    let selectedCrimes = [];
    let activeCategory = 'Todos';
    let pendingCrime = null;
    let entryCounter = 0;
    let activeCommTemplate = null;
    let activeTheme = localStorage.getItem('dbc-theme') || 'dark';

    // 1. Categories
    const categories = ['Todos', ...new Set(crimesData.map(c => c.category))];

    const commsTemplates = [
        {
            id: 'loja',
            title: 'Comunicado Loja',
            description: 'Parâmetros: Código Postal',
            params: [{ key: 'zipcode', label: 'Código Postal' }],
            template: '/police O Departamento Blaine County informa que está a decorrer um assalto na loja do Cód. P.: (%{zipcode}). Pedimos que não circulem perto do local. Desobediência resultará em detenção. Obrigado pela compreensão.'
        },
        {
            id: 'ammunation',
            title: 'Comunicado Ammunation',
            description: 'Parâmetros: Código Postal',
            params: [{ key: 'zipcode', label: 'Código Postal' }],
            template: '/police O Departamento Blaine County informa que está a decorrer um assalto na Ammunation do Cód. P.: (%{zipcode}). Pedimos que não circulem perto do local. Desobediência resultará em detenção. Obrigado pela compreensão.'
        },
        {
            id: 'joalharia',
            title: 'Comunicado Joalharia',
            description: 'Parâmetros: Nenhum',
            params: [],
            template: '/police O Departamento Blaine County informa que está a decorrer um assalto na Joalharia Vangelico. Pedimos que não circulem perto do local. Desobediência resultará em detenção. Obrigado pela compreensão.'
        },
        {
            id: 'banco',
            title: 'Comunicado Banco',
            description: 'Parâmetros: Código Postal',
            params: [{ key: 'zipcode', label: 'Código Postal' }],
            template: '/police O Departamento de Blaine County informa que está a decorrer um assalto no Banco ((%{zipcode})) do Cód. P.: (%{zipcode}). Pedimos que não circulem perto do local. Desobediência resultará em detenção. Obrigado pela compreensão.'
        },
        {
            id: 'tribunal',
            title: 'Comunicado Perímetro Tribunal',
            description: 'Parâmetros: Nenhum',
            params: [],
            template: '/police O DBC informa que a rua do tribunal se encontra CORTADA. Desobediência resultará em detenção.'
        },
        {
            id: 'hospital',
            title: 'Comunicado Perímetro Hospital',
            description: 'Parâmetros: Nenhum',
            params: [],
            template: '/police O DBC informa que está a ser realizado um perímetro de segurança no hospital. Posto isto, qualquer pessoa que necessite de cuidados médicos terá de ser revista antes de prosseguir para a zona de urgências. Agradecemos a compreensão.'
        },
        {
            id: 'posto-florestal',
            title: 'Comunicado Posto Florestal',
            description: 'Parâmetros: Nenhum',
            params: [],
            template: '/police O Departamento de Blaine County informa que o Posto Florestal se encontra em Funções.'
        },
        {
            id: 'esquadra',
            title: 'Comunicado Esquadra',
            description: 'Parâmetros: Nenhum',
            params: [],
            template: '/police O Departamento de Blaine County informa que a Esquadra se encontra em Funções.'
        },
        {
            id: 'posto-florestal-aberto',
            title: 'Comunicado Posto Florestal Aberto',
            description: 'Parâmetros: Nenhum',
            params: [],
            template: '/police O Departamento de Blaine County informa que o Posto Florestal está aberto. Em caso de denúncia ou ajuda, ligue para o 112 com os maiores detalhes possíveis. Boa caça!'
        },
        {
            id: 'posto-florestal-fechado',
            title: 'Comunicado Posto Florestal Fechado',
            description: 'Parâmetros: Nenhum',
            params: [],
            template: '/police O Departamento de Blaine County informa que o Posto Florestal está encerrado.'
        }
    ];

    function formatCrimeName(name) {
        return name.toLowerCase().replace(/(^|\s|[-\/])([^\s-\/])/g, (match, prefix, char) => prefix + char.toUpperCase());
    }

    function renderTabs() {
        categoryNav.innerHTML = '';
        categories.forEach(cat => {
            const tab = document.createElement('div');
            tab.className = `tab ${activeCategory === cat ? 'active' : ''}`;
            tab.textContent = cat;
            tab.onclick = () => {
                activeCategory = cat;
                showCrimesView();
                renderTabs();
                renderCrimes();
            };
            categoryNav.appendChild(tab);
        });
    }

    function showComunicados() {
        commsView.classList.remove('hidden');
        crimesView.classList.add('hidden');
        commsBtn.classList.add('active');
    }

    function showCrimesView() {
        commsView.classList.add('hidden');
        crimesView.classList.remove('hidden');
        commsBtn.classList.remove('active');
    }

    function applyTheme(theme) {
        if (theme === 'light') {
            document.body.classList.add('light-theme');
            themeToggleBtn.textContent = '⚙️ Tema: Claro';
            if (logoImage) logoImage.src = 'logo2.png';
        } else {
            document.body.classList.remove('light-theme');
            themeToggleBtn.textContent = '⚙️ Tema: Escuro';
            if (logoImage) logoImage.src = 'dbc.png';
        }
        localStorage.setItem('dbc-theme', theme);
        activeTheme = theme;
    }

    function toggleTheme() {
        applyTheme(activeTheme === 'dark' ? 'light' : 'dark');
    }

    function renderCommsTemplates() {
        const list = document.getElementById('commsTemplateList');
        list.innerHTML = '<h2>Modelos de Comunicados</h2>';
        commsTemplates.forEach(template => {
            const item = document.createElement('div');
            item.className = 'comms-template';
            item.innerHTML = `
                <div class="template-info">
                    <h3>${template.title}</h3>
                    <p>${template.description}</p>
                </div>
                <div class="template-actions">
                    <button class="btn-select" data-template="${template.id}">Selecionar</button>
                    <button class="btn-copy" data-copy="${template.id}">Copiar Template</button>
                </div>
            `;
            list.appendChild(item);
        });
    }

    function updateCommForm() {
        const paramsContainer = document.getElementById('generatorParams');
        const title = document.getElementById('generatorTitle');
        const form = document.getElementById('generatorForm');
        form.querySelectorAll('.generator-param-row').forEach(node => node.remove());

        if (!activeCommTemplate) {
            title.textContent = 'Selecione um modelo para começar';
            paramsContainer.textContent = 'Nenhum modelo selecionado.';
            return;
        }

        title.textContent = activeCommTemplate.title;
        paramsContainer.textContent = activeCommTemplate.description;

        if (activeCommTemplate.params.length === 0) {
            return;
        }

        activeCommTemplate.params.forEach(param => {
            const row = document.createElement('div');
            row.className = 'generator-param-row';
            row.innerHTML = `
                <input type="text" id="param-${param.key}" placeholder="${param.label}">
                <input type="text" readonly value="${param.label}" disabled>
            `;
            form.insertBefore(row, form.querySelector('.generator-actions'));
            row.querySelector(`#param-${param.key}`).addEventListener('input', generateCommText);
        });
    }

    function generateCommText() {
        if (!activeCommTemplate) return;

        let text = activeCommTemplate.template;
        activeCommTemplate.params.forEach(param => {
            const input = document.getElementById(`param-${param.key}`);
            const value = input ? input.value.trim() : '';
            const placeholder = value || `[${param.label}]`;
            text = text.split(`%{${param.key}}`).join(placeholder);
        });

        document.getElementById('commsOutput').value = text;
    }

    function copyCommText() {
        const output = document.getElementById('commsOutput');
        if (!output.value) return;
        navigator.clipboard.writeText(output.value).then(() => {
            alert('Texto copiado para o clipboard.');
        });
    }

    // 2. Render Crimes
    function renderCrimes() {
        const searchTerm = crimeSearch.value.toLowerCase();
        const filtered = crimesData.filter(c => {
            const matchesSearch = c.name.toLowerCase().includes(searchTerm) || 
                                 c.category.toLowerCase().includes(searchTerm);
            const matchesCategory = activeCategory === 'Todos' || c.category === activeCategory;
            return matchesSearch && matchesCategory;
        });

        crimesGrid.innerHTML = '';
        filtered.forEach((crime, index) => {
            const isSelected = selectedCrimes.some(sc => sc.id === crime.id);
            const card = document.createElement('div');
            card.className = `crime-card ${isSelected ? 'selected' : ''}`;
            card.style.animationDelay = `${index * 0.03}s`; // Staggered animation
            
            card.innerHTML = `
                <div class="card-top">
                    <span class="crime-tag">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                        ${crime.category}
                    </span>
                    <div class="crime-name">${formatCrimeName(crime.name)}</div>
                </div>
                <div class="crime-stats">
                    <div class="stat">
                        <span class="stat-label">Multa Base</span>
                        <span class="stat-val">${crime.fine > 0 ? crime.fine.toLocaleString() + '€' : 'Decisão Judicial'}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Pena</span>
                        <span class="stat-val">${crime.jail > 0 ? crime.jail + ' meses' : 'N/A'}</span>
                    </div>
                </div>
            `;
            card.onclick = () => handleCrimeSelection(crime);
            crimesGrid.appendChild(card);
        });
    }

    // 3. Selection Logic
    function handleCrimeSelection(crime) {
        if (crime.hasQuantity || crime.hasMultipliers || crime.hasOfficialBonus || crime.hasSubtypes || crime.isMoneyCrime) {
            openConfigModal(crime);
        } else {
            selectedCrimes.push({ ...crime, qty: 0, mults: {}, entryId: ++entryCounter });
            updateUI();
            renderCrimes();
        }
    }

    function openConfigModal(crime) {
        pendingCrime = crime;
        modalTitle.textContent = formatCrimeName(crime.name);
        modalBody.innerHTML = '';

        if (crime.hasSubtypes) {
            const label = document.createElement('label');
            label.textContent = crime.subtypeLabel || 'Tipo:';
            const select = document.createElement('select');
            select.id = 'modalSubtype';
            select.className = 'modal-select';
            Object.entries(crime.subtypes).forEach(([name, val]) => {
                const opt = document.createElement('option');
                opt.value = name;
                opt.textContent = `${name} (${val.toLocaleString()}€/un)`;
                select.appendChild(opt);
            });
            modalBody.appendChild(label);
            modalBody.appendChild(select);

            if (crime.hasBaseOption && crime.baseFine) {
                const baseToggle = document.createElement('div');
                baseToggle.className = 'base-toggle';
                baseToggle.innerHTML = `
                    <label>
                        <span>Valor Base</span>
                        <span class="base-value">${crime.baseFine.toLocaleString()}€</span>
                        <input type="checkbox" id="modalBase" checked>
                    </label>
                `;
                modalBody.appendChild(baseToggle);
            }

            const qtyLabel = document.createElement('label');
            qtyLabel.textContent = 'Quantidade:';
            const qtyInput = document.createElement('input');
            qtyInput.type = 'number';
            qtyInput.id = 'modalQty';
            qtyInput.min = '1';
            qtyInput.value = '1';
            modalBody.appendChild(qtyLabel);
            modalBody.appendChild(qtyInput);
        } else if (crime.isMoneyCrime) {
            const label = document.createElement('label');
            label.textContent = 'Valor Total Apreendido (€):';
            const input = document.createElement('input');
            input.type = 'number';
            input.id = 'modalMoney';
            input.min = '0';
            input.value = '0';
            modalBody.appendChild(label);
            modalBody.appendChild(input);

            const note = document.createElement('div');
            note.style.fontSize = '11px';
            note.style.color = 'var(--text-secondary)';
            note.style.marginTop = '-15px';
            note.style.marginBottom = '20px';
            note.textContent = 'A coima será de 75% do valor inserido. (Limite legal: 10.000€)';
            modalBody.appendChild(note);
        } else {
            if (crime.hasQuantity) {
                const label = document.createElement('label');
                label.textContent = crime.qtyLabel || 'Quantidade:';
                const input = document.createElement('input');
                input.type = 'number';
                input.id = 'modalQty';
                input.min = '0';
                input.value = crime.threshold || 1;
                modalBody.appendChild(label);
                modalBody.appendChild(input);
            }

            if (crime.hasMultipliers) {
                Object.entries(crime.types).forEach(([name, val]) => {
                    const label = document.createElement('label');
                    label.textContent = `${name} (+${val.toLocaleString()}€):`;
                    const input = document.createElement('input');
                    input.type = 'number';
                    input.className = 'modal-mult';
                    input.dataset.name = name;
                    input.dataset.val = val;
                    input.min = '0';
                    input.value = '0';
                    modalBody.appendChild(label);
                    modalBody.appendChild(input);
                });
            }

            if (crime.hasOfficialBonus) {
                const label = document.createElement('label');
                label.className = 'check-container';
                label.innerHTML = `<input type="checkbox" id="modalBonus"> Vitima Funcionário Público (+15.000€)`;
                modalBody.appendChild(label);
            }
        }

        configModal.classList.remove('hidden');
    }

    saveModalBtn.onclick = () => {
        const qtyInput = document.getElementById('modalQty');
        const bonusInput = document.getElementById('modalBonus');
        const multInputs = document.querySelectorAll('.modal-mult');
        const subtypeSelect = document.getElementById('modalSubtype');
        const moneyInput = document.getElementById('modalMoney');
        const baseInput = document.getElementById('modalBase');

        const mults = {};
        multInputs.forEach(input => {
            mults[input.dataset.name] = { 
                qty: parseInt(input.value) || 0, 
                val: parseInt(input.dataset.val) 
            };
        });

        selectedCrimes.push({
            ...pendingCrime,
            qty: qtyInput ? parseInt(qtyInput.value) : 0,
            isOfficial: bonusInput ? bonusInput.checked : false,
            mults: mults,
            subtype: subtypeSelect ? subtypeSelect.value : null,
            moneyAmount: moneyInput ? parseInt(moneyInput.value) : 0,
            useBase: baseInput ? baseInput.checked : true,
            entryId: ++entryCounter
        });

        configModal.classList.add('hidden');
        updateUI();
        renderCrimes();
    };

    cancelModalBtn.onclick = () => configModal.classList.add('hidden');

    // 4. Update UI & Calculations
    function updateUI() {
        selectedCrimesList.innerHTML = '';
        
        let totalFine = 0;
        let totalJail = 0;

        if (selectedCrimes.length === 0) {
            selectedCrimesList.innerHTML = `
                <div class="empty-placeholder">
                    <div class="icon">⚖️</div>
                    <p>Nenhuma infração selecionada.</p>
                </div>
            `;
        }

        selectedCrimes.forEach(c => {
            let crimeFine = c.fine;
            let crimeJail = c.jail;
            let calcDesc = '';

            if (c.hasSubtypes && c.subtype) {
                const unitVal = c.subtypes[c.subtype];
                const base = c.hasBaseOption ? (c.useBase ? (c.baseFine || c.fine) : 0) : c.fine;

                if (base === 0) {
                    crimeFine = unitVal * c.qty;
                } else {
                    crimeFine = base + (unitVal * c.qty);
                }

                calcDesc = `${c.qty}x ${c.subtype} (${unitVal.toLocaleString()}€)`;
            } else if (c.isMoneyCrime) {
                crimeFine = c.moneyAmount * 0.75;
                calcDesc = `75% de ${c.moneyAmount.toLocaleString()}€`;
            } else {
                if (c.hasQuantity) {
                    const threshold = c.threshold || 0;
                    const extra = Math.max(0, c.qty - threshold);
                    if (extra > 0) {
                        const addValue = extra * c.addValue;
                        crimeFine += addValue;
                        calcDesc = `${c.fine.toLocaleString()}€ + (${extra} x ${c.addValue.toLocaleString()}€)`;
                    }
                    if (c.maxFine && crimeFine > c.maxFine) crimeFine = c.maxFine;
                }

                Object.values(c.mults).forEach(m => {
                    if (m.qty > 0) {
                        crimeFine += m.qty * m.val;
                    }
                });

                if (c.isOfficial) {
                    crimeFine += 15000;
                }
            }

            totalFine += crimeFine;
            totalJail += crimeJail;

            const item = document.createElement('div');
            item.className = 'reg-item';
            item.innerHTML = `
                <div class="reg-main">
                    <div class="reg-info">
                        <h4>${formatCrimeName(c.name)}</h4>
                        <p>${crimeFine.toLocaleString()}€ • ${crimeJail} meses</p>
                    </div>
                    <button class="btn-remove" onclick="removeCrime(${c.entryId})">✕</button>
                </div>
                ${calcDesc ? `<div class="reg-calc">Cálculo: ${calcDesc}</div>` : ''}
            `;
            selectedCrimesList.appendChild(item);
        });

        totalFineEl.textContent = `${totalFine.toLocaleString()}€`;
        totalJailEl.textContent = `${totalJail} meses`;
    }

    window.removeCrime = (entryId) => {
        selectedCrimes = selectedCrimes.filter(c => c.entryId !== entryId);
        updateUI();
        renderCrimes();
    };

    clearAllBtn.onclick = () => {
        if (selectedCrimes.length === 0) return;
        if (confirm('Deseja limpar todos os registos?')) {
            selectedCrimes = [];
            extraNotesArea.value = '';
            updateUI();
            renderCrimes();
        }
    };

    // 5. Generate Ticket
    generateTicketBtn.onclick = () => {
        if (selectedCrimes.length === 0) {
            alert('Por favor, selecione pelo menos uma infração.');
            return;
        }

        const modal = document.getElementById('ticketModal');
        const printArea = document.getElementById('ticketPrintArea');
        const userText = extraNotesArea.value;

        let crimeLines = '';
        let totalExtra = 0;

        selectedCrimes.forEach(c => {
            let crimeFine = c.fine;
            let line = '';

            if (c.hasSubtypes && c.subtype) {
                const unitVal = c.subtypes[c.subtype];
                const base = c.hasBaseOption ? (c.useBase ? (c.baseFine || c.fine) : 0) : c.fine;

                if (base === 0) {
                    crimeFine = unitVal * c.qty;
                    line = `${formatCrimeName(c.name)} - ${c.subtype} - ${c.qty} = ${unitVal.toLocaleString()} X ${c.qty} = ${crimeFine.toLocaleString()}€`;
                } else {
                    crimeFine = base + (unitVal * c.qty);
                    line = `${formatCrimeName(c.name)} - ${c.subtype} - ${c.qty} = ${base.toLocaleString()} + ${unitVal.toLocaleString()} X ${c.qty} = ${crimeFine.toLocaleString()}€`;
                }
            } else if (c.isMoneyCrime) {
                crimeFine = c.moneyAmount * 0.75;
                line = `${formatCrimeName(c.name)} - ${c.moneyAmount.toLocaleString()}€ = 75% = ${crimeFine.toLocaleString()}€`;
            } else if (c.hasQuantity) {
                const threshold = c.threshold || 0;
                const extra = Math.max(0, c.qty - threshold);
                const addRate = c.addValue || 0;
                if (extra > 0) {
                    crimeFine = c.fine + extra * addRate;
                    line = `${formatCrimeName(c.name)} - ${c.qty} = ${addRate.toLocaleString()} X ${extra} = ${crimeFine.toLocaleString()}€`;
                } else {
                    crimeFine = c.fine;
                    line = `${formatCrimeName(c.name)} - ${c.qty} = ${crimeFine.toLocaleString()}€`;
                }
            } else {
                let calcParts = [];
                if (c.hasMultipliers) {
                    Object.entries(c.mults).forEach(([name, m]) => {
                        if (m.qty > 0) {
                            const part = `${m.val.toLocaleString()} X ${m.qty}`;
                            calcParts.push(`${name} - ${part}`);
                        }
                    });
                }

                if (calcParts.length > 0) {
                    line = `${formatCrimeName(c.name)} - ${calcParts.join(', ')} = ${crimeFine.toLocaleString()}€`;
                } else {
                    line = `${formatCrimeName(c.name)} = ${crimeFine.toLocaleString()}€`;
                }
            }

            totalExtra += crimeFine;
            crimeLines += `<div style="font-size: 13px; line-height: 1.6; margin-bottom: 8px;">${line}</div>`;
        });

        const totalFine = 0;
        const totalRecommended = 0;

        let html = `
            <div class="ticket-header">
                <div style="font-size: 16px; font-weight: 800; letter-spacing: 2px; margin-bottom: 10px;">ESTADO DE LOS SANTOS</div>
                <h2 style="font-size: 26px; margin-bottom: 6px;">RELATÓRIO OFICIAL DE OCORRÊNCIA</h2>
                <p style="font-size: 12px; opacity: 0.7; margin-top: 5px;">EMITIDO EM: ${new Date().toLocaleString('pt-PT')}</p>
            </div>

            <div style="font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
                📝 <strong>Resumo:</strong>
                <div style="margin-top: 10px;">➙ ${userText ? userText.replace(/\n/g, '<br>') : ''}</div>
            </div>

            <div style="font-size: 14px; line-height: 1.7; margin-bottom: 20px;">
                --------------------------📸<strong>Evidências</strong>📸----------------------------<br>
                CC: <br>
                ➙ <strong>Foto 1</strong> - Cad<br>
                ➙ <strong>Foto 2</strong> - Foto sujeito<br>
                ➙ <strong>Foto 3</strong> - Identificação<br>
                ➙ <strong>Foto 4</strong> - Identificação da arma<br>
                ➙ <strong>Foto 5</strong> - Bolsos do sujeito<br>
            </div>

            <div style="font-size: 14px; line-height: 1.7; margin-bottom: 20px;">
                -------------------------💰<strong>Coimas Extras</strong>💰-------------------------<br>
                CC:<br>
                ${crimeLines || '<div style="margin-top: 10px;">Nenhuma coima extra selecionada.</div>'}
                <div style="margin-top: 12px; font-weight: 800;">Total de coimas extra - ${totalExtra.toLocaleString()}€</div>
                <div style="margin-top: 6px; font-weight: 800;">Total de coima recomendada - ${totalRecommended.toLocaleString()}€</div>
                <div style="margin-top: 6px; font-weight: 800;">Total coimas = ${totalFine.toLocaleString()}€</div>
            </div>

            <div style="font-size: 14px; line-height: 1.7; margin-bottom: 20px;">
                ----------------------------⚖️<strong>Medição</strong>⚖️----------------------------<br>
                Mediação ao cargo da DBC.
            </div>

            <div style="font-size: 14px; line-height: 1.7; margin-bottom: 20px;">
                ---------------------------📝<strong>Ocorrência</strong>📝----------------------------<br>
                Líder da ocorrência:<br>
                ➙ <br><br>
                Realizador da Identificação:<br>
                ➙ <br><br>
                Realizador da/s revista/s ao/s civil/s:<br>
                ➙ <br>
            </div>
        `;

        printArea.innerHTML = html;
        modal.classList.remove('hidden');
    };

    // Init
    renderTabs();
    renderCrimes();
    renderCommsTemplates();
    applyTheme(activeTheme);
    crimeSearch.oninput = renderCrimes;
    commsBtn.onclick = showComunicados;
    themeToggleBtn.onclick = toggleTheme;

    document.getElementById('commsTemplateList').addEventListener('click', event => {
        const target = event.target;
        if (target.matches('.btn-select')) {
            const templateId = target.dataset.template;
            activeCommTemplate = commsTemplates.find(t => t.id === templateId);
            updateCommForm();
            document.getElementById('commsOutput').value = '';
        }

        if (target.matches('.btn-copy')) {
            const templateId = target.dataset.copy;
            const template = commsTemplates.find(t => t.id === templateId);
            if (template) {
                navigator.clipboard.writeText(template.template).then(() => {
                    alert('Template copiado para o clipboard.');
                });
            }
        }
    });

    document.getElementById('generateComms').onclick = generateCommText;
    document.getElementById('resetComms').onclick = () => {
        activeCommTemplate = null;
        document.getElementById('commsOutput').value = '';
        updateCommForm();
    };

    document.getElementById('copyCommsText').onclick = copyCommText;
});
