/**
 * Delirium Decor - Módulo de Promociones
 * Maneja la lógica de precios temporales para artículos no vendidos.
 */

let promos = [];

/**
 * Carga las promociones desde Supabase
 */
async function fetchPromos() {
    if (!DB) return;
    try {
        const { data, error } = await DB.from('promociones').select('*').eq('activa', true);
        if (error) throw error;
        promos = data || [];
        renderPromosList();
    } catch (e) {
        toast('Error al cargar promociones: ' + e.message, 'err');
    }
}

/**
 * Renderiza los listados en la página de Promociones
 */
function renderPromosList() {
    const availBody = document.getElementById('promo-avail-body');
    const activeBody = document.getElementById('promo-active-body');
    if (!availBody || !activeBody) return;

    const query = (document.getElementById('promo-search')?.value || '').toLowerCase();

    // 1. Artículos Disponibles (No vendidos y sin promo activa)
    let unsoldArts = [];
    tickets.forEach(t => {
        (t.items || []).forEach(i => {
            const hasPromo = promos.some(p => p.articulo_id === i.id);
            if (['pendiente', 'apartado', 'descuento'].includes(i.estado) && !hasPromo) {
                if (!query || i.nombre.toLowerCase().includes(query) || (i.codigo_barras || '').toLowerCase().includes(query)) {
                    unsoldArts.push({ ...i, folio: t.folio });
                }
            }
        });
    });

    availBody.innerHTML = unsoldArts.slice(0, 50).map(a => `
        <tr>
            <td>
                <div style="font-weight:500">${a.nombre}</div>
                <div style="font-size:11px; color:var(--muted)">${a.folio} · ${a.codigo_barras || 'Sin código'}</div>
            </td>
            <td style="font-weight:600">$${(+a.precio_unitario || 0).toFixed(2)}</td>
            <td>
                <button class="btn btn-xs btn-gold" onclick="openPromoModal('${a.id}')">Asignar</button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="3" class="empty">No hay artículos disponibles</td></tr>';

    // 2. Promociones Activas
    activeBody.innerHTML = promos.map(p => {
        const art = findArtById(p.articulo_id);
        if (!art) return '';
        const isExpired = p.fecha_fin && new Date(p.fecha_fin) < new Date().setHours(0,0,0,0);
        
        return `
            <tr style="${isExpired ? 'opacity:0.6' : ''}">
                <td>
                    <div style="font-weight:500">${art.nombre}</div>
                    <div style="font-size:11px; color:var(--muted)">Orig: $${(+p.precio_original).toFixed(2)}</div>
                </td>
                <td>
                    <div style="font-weight:700; color:var(--rose)">$${(+p.precio_promocional).toFixed(2)}</div>
                </td>
                <td style="font-size:12px; color:${isExpired ? 'var(--rose)' : 'var(--muted)'}">
                    ${p.fecha_fin ? fDate(p.fecha_fin) : 'Indefinida'}
                    ${isExpired ? '<br><b>(Vencida)</b>' : ''}
                </td>
                <td>
                    <button class="btn btn-xs btn-out" onclick="deletePromo('${p.id}')">Eliminar</button>
                </td>
            </tr>
        `;
    }).join('') || '<tr><td colspan="4" class="empty">No hay promociones activas</td></tr>';
}

/**
 * Abre el modal para crear una promoción
 */
function openPromoModal(artId) {
    const art = findArtById(artId);
    if (!art) return;

    document.getElementById('promo-art-id').value = art.id;
    document.getElementById('promo-art-info').innerHTML = `
        <div style="font-weight:700">${art.nombre}</div>
        <div style="font-size:11px">${art.codigo_barras || 'Sin código'}</div>
    `;
    document.getElementById('promo-p-orig').value = (+art.precio_unitario || 0);
    document.getElementById('promo-p-new').value = '';
    document.getElementById('promo-start').value = new Date().toISOString().split('T')[0];
    document.getElementById('promo-end').value = '';

    om('m-promo');
}

/**
 * Guarda la promoción en Supabase
 */
async function savePromo() {
    const id = document.getElementById('promo-art-id').value;
    const pNew = document.getElementById('promo-p-new').value;
    const pOrig = document.getElementById('promo-p-orig').value;
    const start = document.getElementById('promo-start').value || null;
    const end = document.getElementById('promo-end').value || null;

    if (!pNew || pNew <= 0) {
        toast('Ingresa un precio promocional válido', 'err');
        return;
    }

    const row = {
        articulo_id: id,
        precio_original: +pOrig,
        precio_promocional: +pNew,
        fecha_inicio: start,
        fecha_fin: end,
        activa: true
    };

    try {
        if (DB) {
            const { data, error } = await DB.from('promociones').insert([row]).select().single();
            if (error) throw error;
            promos.unshift(data);
        } else {
            // Mock para demo
            promos.unshift({ ...row, id: crypto.randomUUID() });
        }
        
        toast('✓ Promoción aplicada correctamente', 'ok');
        cm('m-promo');
        renderPromosList();
        render(); // Para actualizar listados generales
    } catch (e) {
        toast('Error al guardar: ' + e.message, 'err');
    }
}

/**
 * Elimina una promoción
 */
async function deletePromo(pId) {
    if (!confirm('¿Eliminar esta promoción y restaurar el precio original?')) return;

    try {
        if (DB) {
            const { error } = await DB.from('promociones').delete().eq('id', pId);
            if (error) throw error;
        }
        promos = promos.filter(p => p.id !== pId);
        toast('✓ Promoción eliminada', 'ok');
        renderPromosList();
        render();
    } catch (e) {
        toast('Error al eliminar: ' + e.message, 'err');
    }
}

/**
 * Helper: Busca un artículo por ID en el estado global
 */
function findArtById(id) {
    for (const t of tickets) {
        const art = (t.items || []).find(i => i.id === id);
        if (art) return art;
    }
    return null;
}

/**
 * Helper: Obtiene la promo activa para un artículo (si existe y no está vencida)
 */
function getActivePromo(artId) {
    const p = promos.find(p => p.articulo_id === artId && p.activa);
    if (!p) return null;

    const today = new Date().setHours(0,0,0,0);
    if (p.fecha_inicio && new Date(p.fecha_inicio) > today) return null;
    if (p.fecha_fin && new Date(p.fecha_fin) < today) return null;

    return p;
}

// Sobrescribir renderizado de botones en Unsold para mostrar badge PROMO
// (Se inyecta en delirium-decor.html mediante modificación de renderUnsold)
