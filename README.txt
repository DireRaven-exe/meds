Проект аптечки (GitHub Pages + локальный редактор)
================================================

Структура:

- data/data.json    — база данных (коробки и лекарства)
- images/           — изображения (коробок и лекарств)
- web/              — сюда кладётся сборка Flutter Web (build/web)
- editor/           — локальный web-редактор (FastAPI)

Использование редактора:

1. Установи зависимости:

   cd editor
   pip install -r requirements.txt

2. Запусти локальный редактор:

   python editor_app.py

3. Открой в браузере:

   http://127.0.0.1:7000/editor

4. Редактируй коробки и лекарства:
   - добавляй / удаляй коробки
   - добавляй / удаляй лекарства
   - загружай изображения через drag & drop (они сохраняются в images/)

5. Нажми «Сохранить», чтобы обновить data/data.json.

6. Нажми «Опубликовать», чтобы сделать git add/commit/push.
   Для этого:
   - этот каталог должен быть Git-репозиторием (git init, git remote add origin ...).
   - git должен быть настроен (user.name, user.email, доступ по SSH или токену).

GitHub Pages:

1. Создай репозиторий на GitHub, например `meds`.

2. Склонируй его локально и скопируй в него содержимое этого архива.

3. Собери Flutter Web (в своём Flutter-проекте):

   flutter build web

   Затем скопируй содержимое build/web в папку web/ этого репозитория.

4. Закоммить и отправь на GitHub.

5. В настройках репозитория включи GitHub Pages:
   - Source: Deploy from a branch
   - Branch: main / root (или /docs, если выберешь другую папку)

6. Во Flutter-приложении укажи URL до raw JSON, например:

   const dataUrl = 'https://raw.githubusercontent.com/<user>/<repo>/main/data/data.json';

   и пути к картинкам:

   'https://raw.githubusercontent.com/<user>/<repo>/main/images/' + filename
