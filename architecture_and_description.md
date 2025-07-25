# 📒 Домашня Бухгалтерія

> **Мета:** створити веб-додаток для особистого / сімейного обліку фінансів із багатокористувацькою підтримкою, безпекою, аналітикою та мультивалютністю.


## 🧭 Ключові цілі
Розробити веб-додаток для ведення особистих фінансів, що підтримує:
- Внесення доходів та витрат, з деталізацією по рахунках, продуктах/послугах та ієрархічних категоріях
- Аналітики по витратах
- Багатокористувацьку роботу, авторизацію та безпеку
- Інтуїтивний інтерфейс з таблицями, фільтрами, модальними діалогами, автозаповненням.
- Аналітику та звітність (графіки, динаміка)
- Багатомовність і валідацію

## ⚙️ Технічні Налаштування
- **Менеджер пакетів:** pnpm
- **Мова:** TypeScript, tsx
- **Технології:** React.js, Node.js, Next.js
- **Архітектура:** Монорепозиторій Next.js
- **ORM:** Prisma
- **База даних:** PostgreSQL
- **CI/CD:** GitHub Actions / Docker / Fly.io / Railway
- **Аутентифікація:** NextAuth зі зберіганням користувачів в БД та сесій в редісі
- **Локалізація:** next-intl v4
- **API:** REST
- **Best Practices:** дотримання стандартів використаних технологій

## 🏗 Структура Проєкту

wfc-monorepo/
├─ apps/
│ ├─ frontend/ # Next.js UI
│ └─ backend/ # NestJS (REST/GraphQL)
├─ packages/
│ ├─ shared/ # Утиліти, хелпери
│ └─ types/ # Спільні TypeScript типи
└─ prisma/ # Схеми та міграції

## 🔑 Аутентифікація
- **NextAuth/OAuth**
- Підтримка соціальних логінів
- Сторедж для користувачів - PostgreSQL через призму
- Сторедж для сесій - Redis

## 🔄 Доменна модель

### 💳 1. Рахунки
- Є доменним елементом, що являє собою рахунок на який заходять доходи і з якого списуються витрати - банківський (картковий) рахунок, готівка, кишенькові кошти, готівкові відкладення та таке
- Рахунок може представляти власний рахунок користувача (type = OWN), або умовний рахунок контрагента, з яким він взаємодіє (type = COUNTERPARTY)
### 🗂 2. Категорії
- Є доменним елементом, що являє собою категорію (чи підкатегорію), до якої належать продукти (чи послуги)
### 📦 3. Продукти (чи послуги)
- Є доменним елементом, що являє собою продукт (чи послугу) - конкретний елемент в транзакції (чеку), який є узагальненим для всіх транзакцій і містить детальну інформацію про продукт чи послугу
### 📄 4. Транзакції
- Є доменним елементом, що являє собою певну транзакцію - виплату доходу, переказ, сплату чеку, обмін валюти
- Транзакція може бути:
    - Витратою - якщо сума менше нуля і counterparty - рахунок контрагента
    - Доходом - якщо сума більше нуля і counterparty - рахунок контрагента
    - Переказом - якщо counterparty - власний рахунок користувача - сума в цьому випадку завжди має бути більше нуля (за винятком обміну валюти), може містити Деталь з певною категорією, що представляє Переказ
    - Обміном валют - це особливий тип Переказу, у якому account - Рахунок основної валюти, який містить Деталь, у якій кількість - сума придбаної валюти і ціна - курс обміну. Якщо при обміні валюти сплачується комісія чи податок - це має бути окрема Деталь. Ця транзакція має посилатися на транзакцію зарахування валюти.
- При збереженні транзакції має перевірятися її баланс - сума всіх витрат/доходів (ціна помножена на кількість) по всім деталям в транзакції має дорівнювати сумі транзакції. Якщо вони відрізняються на величину більше деякої (збереженої в налаштуваннях додатку) - має викидуватись помилка і зміни не мають бути збережені (в інтерфейсі має бути схожа перевірка з можливостями виправлення).
### 📁 5. Деталізації транзакцій
- Є доменним елементом, що являє собою певну деталь транзакції - окрему строку в чеку, що посилається на певний продукт (чи послугу) та зберігає такі деталі, як ціна, кількість

> **Примітка:** Частиною опису доменної моделі є також конфігурація призми у файлі /apps/backend/prisma/schema.prisma

## 🔧 Основні Модулі

### 💳 1. Рахунки
- Представлення у UI:
    - Таблиця з колонками: назва, опис, валюта, баланс
    - Додавання/редагування/видалення рахунків

### 🗂 2. Категорії
- Представлення у UI:
    - Ієрархічне дерево категорій (з підкатегоріями)
    - Вузли в піддеревах сортуються за назвою
    - Додавання підкатегорії будь-якого рівня через контекстне меню "Додати підкатегорію" - при цьому додається елемент в кінець піддерева того елемента, на якому застосований пункт меню з текстбоксом для введення назви підкатегорії, який зберігається натисненням Enter після вводу, або кнопкою поряд із текстбоком
    - Додавання підкатегорії через контекстне меню "Додати кореневу категорію" - при цьому додається елемент в кінець корнівого дерева з текстбоксом для введення назви категорії, який зберігається натисненням Enter після вводу, або кнопкою поряд із текстбоком
    - Редагування - через контекстне меню "Редагувати", яке перетворює лейбу відповідного узла на текстбокс із кнопкою - такі самі як і при Додаванні
    - Видалення - через контекстне меню "Видалити"
    - Перегляд списку продуктів, що належать категорії - Таблиця під деревом категорій з колонками (тип, назва, виробник, одиниця виміру, розмір, опис)
    - Можливість відв'язати продукт від категорії через контекстне меню "Відв'язати"
    - Під таблицею прив'язаних продуктів має бути таблиця всіх інших продуктів з такими самими полями та додактовим полем категорія (до якої вони наразі прив'язані)
    - В ціх другій таблиці має бути контекстне меню "Прив'язати" (якщо продукт не прив'язаний до жодної категорії, або "Переприв'язати" (якщо продукт вже прив'язаний до якоїсь категорії)
    - Після застосування всіх перелічених вище елементів контекстних меню продукти мають відповідно мігрувати між ціма таблицями
    - Обидві таблиці мають мати інструменти фільтрації та пошуку по всіх колонках
- При виводі на UI категорія (як правило, якщо не вказано інше для конкретної елемента) виводиться з усіма своїми надкатегоріями, розділеними символом / , починаючи з корневої категорії

### 📦 3. Продукти (чи послуги)
- Представлення у UI:
    - Таблиця продуктів з такими полями: тип (продукт/послуга), назва, виробник/виконавець, одиниця виміру, розмір (маса, обʼєм, кількість в одній одиниці), категорія, опис
    - Додавання/редагування/видалення стандартними засобами CRUD для таблиці
    - Категорія обирається з селектбоксу, що працює згідно з "Селектбокс з пошуком та додаванням по ключовому полю", де ключове поле - назва Категорії. Ця назва також може включати символи \ - в такому випадку вказується певний шлях або підшлях до категорії, який має враховуватися:
        - В пошуку - співпадіння має бути не тільки за назвою підкатегорії, але і за назвами введеної кількості її надкатегорій (як від кореня, так і від будь-якої іншої підкатегорії)
        - При додаванні - Підкатегорія з введеним шляхом створюється відносно кореня категорій, при цьому створюються також всі неіснуючі її надкатегорії, вказані в шляху

### 📄 4. Транзакції
- Представлення у UI:
    - Таблиця сумарних витрат (чеків)
    - Колонки: дата, назва, рахунок, контрагент, опис, сума
    - Деталі транзакції можуть бути відображеними в модальному вікні (продукти, кількість, ціна, категорії) за допомогою контекстного меню "Показати деталі"
    - Створення нової, Редагування/видалення транзакції з деталізацією - згідно зі "Стандартними засобами CRUD для таблиці" та такими додатковими умовами:
        - При додаванні та редагуванні в формі, ця форма має додатково містити таблицю з Деталями - із колонками (продукт, ціна, кількість), яка може змінюватись згідно зі "Стандартними засобами CRUD для таблиці"
        - Продукт обирається згідно "Вибір Продукту"
- При додаванні чи редагуванні транзакції має перевірятися її баланс - сума всіх витрат/доходів (ціна помножена на кількість) по всім деталям в транзакції має дорівнювати сумі транзакції. Якщо вони відрізняються на величину більше деякої (збереженої в налаштуваннях додатку) - користувачу має бути показано попередження про цю різницю, з пропозицією додати деталь "Дисбаланс" з кількістю 1 та ціною, що нівелює цю різницю. Користувач може погодитись, або відмовитись і продовжити редагування Деталей.

### 📁 5. Деталізації транзакцій
- Представлення у UI:
    - Зведена таблиця з Транзакціями з детальною інформацією про транзакції
    - Складається з блоків по кілька рядків:
        - Блок починається з Рядку Транзакції, що містить 3 осередки: дата та інформацію про транзакцію - рядок, що складається з таких полей транзакції (назва, рахунок, контрагент) - має за допомогою colspan об'єднати осередки - всі в рядку, окрім першого і останнього, та сума - останній осередок, має бути в одній колонці із сумою деталей транзакції
        - За ним ідуть рядки Деталей, що містять колонки: пустий відступ (для візуального групування транзакцій) - під датою, продукт, категорія, кількість з одиницею виміру, ціна, сума = кількість * ціна
    - Фільтрація по різним параметрам
    - Компоненти для додавання та редагування чи видалення Транзакцій - такі самі, як і на сторінці Транзакцій
    - Можливість додавати, видаляти та редагувати Деталі додаючи, видаляючи та редагуючи відповідні рядки під рядком Транзакції згідно зі "Стандартними засобами CRUD для таблиці"
    - Продукт, у відповідних полях чи колонках, обирається згідно "Вибір Продукту"

### 📊 6. Аналітика
- Графіки витрат по категоріях за часом
- Звіти за категоріями, контрагентами, рахунками, часом
- Динаміка витрат

### 7. Загальні особливості редагування в інтерфейсі:
- Селектбокс з пошуком та додаванням по ключовому полю:
    - в селектбокс можна вводити текст, за яким буде іти фільтація та відображатися подходящі елементи, що відфільтровані по певному ключовому полю
    - в результати пошуку має бути доданий елемент "Додати [елемент]" (в залежності від конкретного поля), при обранні якого виконується додавання нового елементу із заповненням ключового поля значенням введеним для пошуку
    - також справа від селектбоксу має бути кнопка-іконка, що відкриває модальне вікно для додавання нового елементу, з формою що містить всі необхідні поля та кнопкою "Додати"
- Вибір Продукту:
    - Продукт обирається з селектбоксу, що працює згідно з "Селектбокс з пошуком та додаванням по ключовому полю", де ключове поле - назва Продукту.
- Додавання/редагування/видалення стандартними засобами CRUD для таблиці:
    - Видалення - обирається відповідний рядок (або кілька рядків) чекбоксом (в першій додатковій колонці, що активується контекстним меню "Вибрати") та натискається кнопка видалити (над таблицею), або пунктом контекстного меню "Видалити" на рядку
    - Редагування - можна безпосередньо редагувати осередки в рядках в таблиці, що активуються подвійним кліком, натисненням Enter або контекстним меню "Редагувати"
    - Додавання - можна додавати рядки в таблицю контекстним меню "Додати [елемент]" (або конкретна назва в конкретній таблиці)
    - Також додавати та редагувати можна за допомогою модального вікна, що містить форму з полями та кнопкою "Додати" або "Зберегти" відповідно та відкривається контекстними меню "Додати в формі" та "Редагувати в формі" відповідно

## 🧪 Майбутнє розширення
- Підтримка тегів
- Планування витрат
- Повідомлення/нагадування
- Імпорт/експорт даних
- Баланс рахунків - історія

---

## 📎 Примітка
Цей документ створено для кращого розуміння суті проекту, його архітектури та бізнес-вимог до інтерфейсу. Оновлюйте його при зміні вимог або архітектури.
