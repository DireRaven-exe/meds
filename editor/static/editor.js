let state = { boxes: [], meds: [], meta: {} };

async function loadData() {
  const res = await fetch('/api/data');
  state = await res.json();
  render();
}

function render() {
  renderBoxes();
  renderMeds();
  renderBoxFilter();
}

function renderBoxes() {
  const root = document.getElementById('boxes-list');
  root.innerHTML = '';
  state.boxes.forEach(box => {
    const div = document.createElement('div');
    div.className = 'box-card';
    div.innerHTML = `
      <div>ID: ${box.id}</div>
      <input placeholder="Название" value="${box.name || ''}" data-field="name">
      <input placeholder="Описание" value="${box.description || ''}" data-field="description">
      <input placeholder="Имя файла картинки (например box1.jpg)" value="${box.image || ''}" data-field="image">
      <button class="delete-box">Удалить</button>
    `;
    div.querySelectorAll('input').forEach(inp => {
      inp.addEventListener('input', () => {
        const field = inp.dataset.field;
        box[field] = inp.value;
      });
    });
    div.querySelector('.delete-box').addEventListener('click', () => {
      state.boxes = state.boxes.filter(b => b.id !== box.id);
      // также уберём лекарства, привязанные к коробке
      state.meds = state.meds.filter(m => m.box_id !== box.id);
      render();
    });
    root.appendChild(div);
  });
}

function renderBoxFilter() {
  const sel = document.getElementById('box-filter');
  const current = sel.value;
  sel.innerHTML = '';
  const optAll = document.createElement('option');
  optAll.value = '';
  optAll.textContent = 'Все коробки';
  sel.appendChild(optAll);
  state.boxes.forEach(box => {
    const opt = document.createElement('option');
    opt.value = String(box.id);
    opt.textContent = box.name || `Box ${box.id}`;
    sel.appendChild(opt);
  });
  sel.value = current;
  sel.onchange = () => renderMeds();
}

function renderMeds() {
  const root = document.getElementById('meds-list');
  root.innerHTML = '';
  const filterBoxId = document.getElementById('box-filter').value;
  let meds = state.meds;
  if (filterBoxId) {
    meds = meds.filter(m => String(m.box_id) === filterBoxId);
  }
  meds.forEach(med => {
    const div = document.createElement('div');
    div.className = 'med-card';
    div.innerHTML = `
      <div class="small">ID: ${med.id}</div>
      <input placeholder="Название" value="${med.name || ''}" data-field="name">
      <input placeholder="ID коробки" value="${med.box_id || ''}" data-field="box_id">
      <input placeholder="Количество" value="${med.qty ?? ''}" data-field="qty">
      <input placeholder="Ед. измерения (таблеток, мл...)" value="${med.qty_unit || ''}" data-field="qty_unit">
      <input placeholder="Годен до (YYYY-MM)" value="${med.expires || ''}" data-field="expires">
      <input placeholder="Ячейка" value="${med.cell || ''}" data-field="cell">
      <input placeholder="Имя файла картинки (например nurofen.jpg)" value="${med.photo || ''}" data-field="photo">
      <input placeholder="Аналоги (через запятую)" value="${(med.analogs || []).join ? med.analogs.join(', ') : med.analogs || ''}" data-field="analogs">
      <input placeholder="Теги (через запятую)" value="${(med.tags || []).join ? med.tags.join(', ') : med.tags || ''}" data-field="tags">
      <textarea placeholder="Заметки" data-field="note">${med.note || ''}</textarea>
      <button class="delete-med">Удалить</button>
    `;
    div.querySelectorAll('input, textarea').forEach(inp => {
      inp.addEventListener('input', () => {
        const field = inp.dataset.field;
        let value = inp.value;
        if (field === 'box_id' || field === 'qty') {
          value = value ? Number(value) : null;
        }
        if (field === 'analogs' || field === 'tags') {
          value = value ? value.split(',').map(v => v.trim()).filter(Boolean) : [];
        }
        med[field] = value;
      });
    });
    div.querySelector('.delete-med').addEventListener('click', () => {
      state.meds = state.meds.filter(m => m.id !== med.id);
      render();
    });
    root.appendChild(div);
  });
}

document.getElementById('add-box').addEventListener('click', () => {
  const maxId = state.boxes.reduce((m, b) => Math.max(m, b.id || 0), 0);
  state.boxes.push({ id: maxId + 1, name: 'Новая коробка', description: '', image: '' });
  render();
});

document.getElementById('add-med').addEventListener('click', () => {
  const maxId = state.meds.reduce((m, b) => Math.max(m, b.id || 0), 0);
  const firstBoxId = state.boxes[0]?.id || 1;
  state.meds.push({
    id: maxId + 1,
    box_id: firstBoxId,
    name: 'Новое лекарство',
    qty: null,
    qty_unit: '',
    expires: '',
    cell: '',
    photo: '',
    note: '',
    analogs: [],
    tags: [],
  });
  render();
});

document.getElementById('save-btn').addEventListener('click', async () => {
  const status = document.getElementById('status');
  status.textContent = 'Сохраняем...';
  const res = await fetch('/api/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state),
  });
  if (res.ok) {
    status.textContent = 'Сохранено в data/data.json';
  } else {
    status.textContent = 'Ошибка при сохранении';
  }
});

document.getElementById('publish-btn').addEventListener('click', async () => {
  const msg = prompt('Комментарий к коммиту (можно оставить по умолчанию):', 'Update data');
  if (msg === null) return;
  const formData = new FormData();
  formData.append('message', msg);
  const status = document.getElementById('status');
  status.textContent = 'Публикуем (git push)...';
  const res = await fetch('/api/publish', {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (data.ok) {
    status.textContent = 'Опубликовано (git push). Проверь GitHub.';
  } else {
    status.textContent = 'Ошибка git: ' + (data.error || 'unknown');
  }
});

/* Drag & drop upload */

const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('fileElem');
const uploadResult = document.getElementById('upload-result');

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
  }, false);
});

['dragenter', 'dragover'].forEach(eventName => {
  dropArea.addEventListener(eventName, () => {
    dropArea.classList.add('highlight');
  }, false);
});
['dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, () => {
    dropArea.classList.remove('highlight');
  }, false);
});

dropArea.addEventListener('click', () => fileInput.click());

dropArea.addEventListener('drop', (e) => {
  const dt = e.dataTransfer;
  const files = dt.files;
  handleFiles(files);
});

fileInput.addEventListener('change', () => {
  handleFiles(fileInput.files);
});

function handleFiles(files) {
  [...files].forEach(uploadFile);
}

async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/upload-image', {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (data.ok) {
    const p = document.createElement('div');
    p.textContent = `Загружено: ${data.filename}`;
    uploadResult.appendChild(p);
  } else {
    const p = document.createElement('div');
    p.textContent = 'Ошибка загрузки файла';
    uploadResult.appendChild(p);
  }
}

window.addEventListener('load', loadData);
