/*
 * Diapason — the single source of truth for every word on every page.
 * All five style pages and the hub render from this file, so the copy can never drift apart.
 * Arrays must have the same length in both languages.
 */
window.DIAPASON_CONTENT = {
  styles: [
    { id: 'brutalism', num: '01', file: 'brutalism.html', accent: '#CCFF00', ink: '#000000' },
    { id: 'glassmorphism', num: '02', file: 'glassmorphism.html', accent: '#2EC4B6', ink: '#0B3C49' },
    { id: 'retro-90s', num: '03', file: 'retro-90s.html', accent: '#0000EE', ink: '#C0C0C0' },
    { id: 'minimalism', num: '04', file: 'minimalism.html', accent: '#FF4D1A', ink: '#F4F3EF' },
    { id: 'cyberpunk', num: '05', file: 'cyberpunk.html', accent: '#FF2E88', ink: '#08070D' }
  ],

  ru: {
    meta: {
      description: 'Диапазон — студия веб-дизайна и разработки. Одна и та же страница в пяти стилях: брутализм, glassmorphism, ретро-90-е, минимализм и киберпанк.',
      hubTitle: 'Диапазон — один сайт, пять характеров'
    },
    a11y: {
      skip: 'Перейти к содержанию',
      lang: 'Язык сайта',
      dock: 'Стили этой страницы',
      menu: 'Меню',
      close: 'Закрыть',
      current: 'текущий стиль',
      newWindow: 'откроется в новом окне'
    },
    brand: {
      name: 'Диапазон',
      descriptor: 'студия веб-дизайна',
      tagline: 'Один бриф — любой характер.'
    },
    lang: { ru: 'RU', en: 'EN', ruFull: 'Русский', enFull: 'English' },
    dock: {
      hub: 'Все стили',
      keys: 'Клавиши 1–5',
      hubKey: '0 — хаб'
    },
    nav: {
      items: [
        { href: '#services', label: 'Услуги' },
        { href: '#work', label: 'Работы' },
        { href: '#process', label: 'Процесс' },
        { href: '#pricing', label: 'Цены' },
        { href: '#faq', label: 'Вопросы' },
        { href: '#contact', label: 'Контакты' }
      ],
      cta: 'Обсудить проект'
    },

    hero: {
      eyebrow: 'Студия веб-дизайна и разработки',
      title: 'Сайты с характером.',
      lead: 'Делаем лендинги, сайты компаний и веб-приложения, которые запоминают с первого экрана. Эта страница существует в пяти стилях: тексты те же — меняется всё остальное.',
      ctaPrimary: 'Обсудить проект',
      ctaSecondary: 'Смотреть работы',
      switchHint: 'Переключите стиль внизу экрана или нажмите 1–5',
      stats: [
        { value: '13', label: 'проектов в портфолио' },
        { value: '5', label: 'стилей на этой странице' },
        { value: '48 ч', label: 'на первый ответ' },
        { value: '2', label: 'концепции на выбор' }
      ]
    },

    services: {
      num: '01',
      title: 'Что делаем',
      lead: 'Берём проект целиком — от идеи и текстов до запуска. Без шаблонов и конструкторов.',
      items: [
        { title: 'Лендинги', text: 'Одна страница, одна цель: заявка, продажа или запись. С вау-моментом на первом экране.', meta: 'от 2 недель' },
        { title: 'Сайты компаний', text: 'Многостраничные сайты с понятной структурой, которые легко обновлять самим.', meta: 'от 4 недель' },
        { title: 'Интернет-магазины', text: 'Каталог, корзина, оплата и личный кабинет. Витрина, в которой хочется задержаться.', meta: 'от 6 недель' },
        { title: 'Веб-приложения и дашборды', text: 'Сервисы, кабинеты и панели управления: сложные данные — в простой интерфейс.', meta: 'от 6 недель' },
        { title: '3D и WebGL', text: 'Конфигураторы, интерактивные сцены и эффекты, которые летают прямо в браузере и на телефоне.', meta: 'от 3 недель' },
        { title: 'Айдентика и дизайн-системы', text: 'Логотип, палитра, шрифты и компоненты — чтобы бренд выглядел одинаково везде.', meta: 'от 2 недель' }
      ]
    },

    work: {
      num: '02',
      title: 'Избранные работы',
      lead: 'Шесть проектов из портфолио — у каждого свой характер. Как и у этой страницы.',
      year: '2026',
      more: 'Ещё шесть проектов — от 3D-комнаты до музыкального визуализатора — покажем на созвоне.',
      items: [
        {
          name: 'Светотень', motif: 'latte',
          type: 'Кофейня-бистро · Нижний Новгород',
          text: 'Сайт живёт по часам кафе: в 18:00 день сменяется свечами. Латте на первом экране можно помешать курсором, а столик — забронировать на живой схеме зала.',
          tags: ['WebGL', 'Бронирование', 'Next.js']
        },
        {
          name: 'Каденс', motif: 'pulse',
          type: 'Фитнес-клуб · Казань',
          text: 'Клуб, который бьётся в ритме вашего пульса: отстучите его — и расписание покажет персональные зоны нагрузки на каждом занятии.',
          tags: ['Пульсовые зоны', 'Запись онлайн', 'Next.js']
        },
        {
          name: 'Kolibri Terminal', motif: 'route',
          type: 'Дашборд курьерской службы',
          text: 'Терминал диспетчера: живой поток заказов, карта города, SLA-тревоги, машина времени и командная строка.',
          tags: ['Дашборд', 'Живые данные', 'Canvas']
        },
        {
          name: 'DVOR 01', motif: 'sneaker',
          type: '3D-конструктор кроссовок',
          text: 'Четыре модели, материал и цвет для каждой детали, надпись на пятке — пара собирается в 3D прямо в браузере.',
          tags: ['Three.js', 'Конфигуратор', 'E-commerce']
        },
        {
          name: 'Аэлита', motif: 'orbit',
          type: 'Межпланетные линии · концепт',
          text: 'Рейсы на Луну, Марс и орбиту: маршрут длиной 216 дней, выбор каюты и посадочный талон в конце лендинга.',
          tags: ['Лендинг', 'Скролл-история', '3D']
        },
        {
          name: 'Ровно', motif: 'ring',
          type: 'Трекер бюджета · PWA',
          text: 'Отвечает на один вопрос: сколько можно потратить сегодня, чтобы денег хватило до зарплаты. Работает офлайн.',
          tags: ['PWA', 'Офлайн', 'UX']
        }
      ]
    },

    process: {
      num: '03',
      title: 'Как работаем',
      lead: 'Четыре шага и никаких сюрпризов: вы всегда знаете, что происходит и когда будет готово.',
      steps: [
        { title: 'Бриф', text: 'Созваниваемся, разбираем задачу, аудиторию и конкурентов. Фиксируем цель, бюджет и срок.', duration: '1–2 дня' },
        { title: 'Концепция', text: 'Показываем два направления: палитра, шрифты, первый экран и главный вау-момент. Вы выбираете.', duration: '3–5 дней' },
        { title: 'Дизайн и разработка', text: 'Собираем сайт целиком, с настоящими текстами. Каждую неделю — живая ссылка на свежую версию.', duration: '2–6 недель' },
        { title: 'Запуск', text: 'Проверяем на телефонах и в браузерах, подключаем домен и аналитику. Месяц поддержки — в подарок.', duration: '1 неделя' }
      ]
    },

    pricing: {
      num: '04',
      title: 'Сколько стоит',
      lead: 'Фиксированная цена после брифа. Предоплата 50%, остаток — после запуска.',
      cta: 'Обсудить',
      note: 'Точную смету называем после брифа — бесплатно и без обязательств.',
      plans: [
        {
          name: 'Лендинг', price: 'от 90 000 ₽', term: '2–3 недели', featured: false, badge: '',
          text: 'Одна страница под одну цель.',
          features: ['Концепция в двух направлениях', 'Адаптив от 375 px', 'Анимации и микровзаимодействия', 'Форма заявки с уведомлениями', 'Базовая SEO-настройка']
        },
        {
          name: 'Сайт компании', price: 'от 240 000 ₽', term: '4–6 недель', featured: true, badge: 'Выбирают чаще всего',
          text: 'Многостраничный сайт с удобной админкой.',
          features: ['До 10 уникальных страниц', 'Дизайн-система и UI-кит', 'Блог или новости с CMS', 'Два языка', 'Интеграция с CRM']
        },
        {
          name: 'Веб-приложение', price: 'от 480 000 ₽', term: 'от 8 недель', featured: false, badge: '',
          text: 'Сервис, магазин или дашборд с бэкендом.',
          features: ['Проектирование сценариев', 'Личный кабинет и роли', 'База данных и API', 'Оплата и уведомления', 'Тесты и сопровождение']
        }
      ]
    },

    faq: {
      num: '05',
      title: 'Вопросы',
      lead: 'Коротко о том, что спрашивают чаще всего.',
      items: [
        { q: 'Сколько стоит сайт?', a: 'Лендинг — от 90 000 ₽, сайт компании — от 240 000 ₽, веб-приложение — от 480 000 ₽. Точную цену фиксируем после брифа, и она не меняется, пока не меняется задача.' },
        { q: 'Сколько времени займёт работа?', a: 'Лендинг — 2–3 недели, сайт компании — 4–6 недель, приложение — от 8 недель. Сроки и этапы прописываем в договоре.' },
        { q: 'Можно в нашем фирменном стиле?', a: 'Конечно. Эта страница показывает диапазон, но работаем мы от вашего бренда: берём брендбук, если он есть, или собираем визуальный язык с нуля.' },
        { q: 'Что нужно от нас для старта?', a: 'Час на бриф, человек, который принимает решения, и пара примеров сайтов, которые нравятся и не нравятся. Тексты можем написать сами.' },
        { q: 'Сайт будет хорошо работать на телефоне?', a: 'Мобильную версию проектируем вместе с десктопной и проверяем на реальных устройствах. Тяжёлые эффекты на телефоне облегчаем, а не выключаем.' },
        { q: 'Что будет после запуска?', a: 'Месяц бесплатной поддержки: правки, мелкие доработки, помощь с контентом. Дальше — по желанию, почасово или абонементом.' }
      ]
    },

    contact: {
      num: '06',
      title: 'Расскажите о проекте',
      lead: 'Ответим в течение 48 часов — с вопросами и примерным бюджетом. Бриф ни к чему не обязывает.',
      details: [
        { label: 'Где', value: 'Удалённо, по всему миру' },
        { label: 'Когда', value: 'Пн–Пт, 10:00–19:00 МСК' },
        { label: 'Ответ', value: 'До 48 часов' }
      ],
      form: {
        name: { label: 'Как вас зовут', placeholder: 'Анна' },
        contact: { label: 'Email или Telegram', placeholder: 'anna@company.ru или @anna' },
        type: { label: 'Что нужно', options: ['Лендинг', 'Сайт компании', 'Интернет-магазин', 'Веб-приложение', '3D и WebGL', 'Пока не знаю'] },
        budget: { label: 'Бюджет', options: ['до 150 000 ₽', '150–400 тыс. ₽', 'от 400 000 ₽', 'Обсудим'] },
        message: { label: 'Пара слов о задаче', placeholder: 'Например: лендинг для кофейни, запуск в марте' },
        submit: 'Отправить заявку',
        sending: 'Отправляем…',
        privacy: 'Нажимая кнопку, вы соглашаетесь, что мы вам ответим. Больше ничего.',
        success: {
          title: 'Заявка у нас!',
          text: 'Спасибо, {name}. Ответим в течение 48 часов.',
          note: 'Это демо-форма концепт-проекта: заявка никуда не отправляется.',
          again: 'Отправить ещё одну'
        },
        errors: {
          name: 'Напишите, как к вам обращаться',
          contact: 'Нужен email или @ник в Telegram'
        }
      }
    },

    footer: {
      colophon: 'Как сделана эта страница',
      fontsLabel: 'Шрифты',
      paletteLabel: 'Палитра',
      rights: '© 2026 Диапазон. Концепт-проект для портфолио.',
      toTop: 'Наверх',
      hub: 'Все пять стилей'
    },

    styles: {
      brutalism: {
        name: 'Брутализм', short: 'Брутализм',
        hero: 'Этот — брутальный.',
        metaTitle: 'Диапазон — брутализм',
        desc: 'Сырые блоки, толстые рамки и честная типографика. Ничего не спрятано и ничего не сглажено.',
        fonts: 'Dela Gothic One + IBM Plex Mono',
        palette: [
          { hex: '#F2F0EB', name: 'Бетон' },
          { hex: '#000000', name: 'Чёрный' },
          { hex: '#CCFF00', name: 'Кислота' }
        ],
        radius: '0 px — только прямые углы',
        motion: 'Резко: мгновенные смены и жёсткие сдвиги',
        signature: 'Стикеры с ценами можно таскать по странице'
      },
      glassmorphism: {
        name: 'Glassmorphism', short: 'Стекло',
        hero: 'Этот — из стекла.',
        metaTitle: 'Диапазон — glassmorphism',
        desc: 'Слои матового стекла над живым светом. Глубина, преломление у краёв и мягкие блики.',
        fonts: 'Geologica',
        palette: [
          { hex: '#0B3C49', name: 'Глубина' },
          { hex: '#2EC4B6', name: 'Лагуна' },
          { hex: '#FF7A45', name: 'Закат' },
          { hex: '#FFC857', name: 'Солнце' }
        ],
        radius: '28 px — мягкие капли',
        motion: 'Плавно: пружины и инерция',
        signature: 'Жидкое стекло преломляет свет за курсором'
      },
      'retro-90s': {
        name: 'Ретро-90-е', short: '90-е',
        hero: 'Этот — из 1997-го.',
        metaTitle: 'Диапазон — ретро-90-е',
        desc: 'Домашняя страница времён модемов: окна Windows 95, счётчик посетителей и MIDI на фоне.',
        fonts: 'Times New Roman + Comic Sans MS + Press Start 2P',
        palette: [
          { hex: '#008080', name: 'Рабочий стол' },
          { hex: '#C0C0C0', name: 'Серый 95' },
          { hex: '#000080', name: 'Заголовок окна' },
          { hex: '#0000EE', name: 'Ссылка' }
        ],
        radius: '0 px и объёмные фаски',
        motion: 'Мигание, бегущая строка, блёстки за курсором',
        signature: 'Окна можно таскать, а чиптюн — включить'
      },
      minimalism: {
        name: 'Минимализм', short: 'Минимализм',
        hero: 'Этот — тихий.',
        metaTitle: 'Диапазон — минимализм',
        desc: 'Воздух, сетка и одна оранжевая точка. Всё остальное — лишнее.',
        fonts: 'Manrope',
        palette: [
          { hex: '#F4F3EF', name: 'Бумага' },
          { hex: '#141414', name: 'Тушь' },
          { hex: '#8A8A85', name: 'Графит' },
          { hex: '#FF4D1A', name: 'Точка' }
        ],
        radius: '0 px, линии толщиной 1 px',
        motion: 'Медленно и точно: 600 мс, одна кривая',
        signature: 'Одна линия прорисовывается через всю страницу'
      },
      cyberpunk: {
        name: 'Киберпанк', short: 'Киберпанк',
        hero: 'Этот — из 2077-го.',
        metaTitle: 'Диапазон — киберпанк',
        desc: 'Неон, HUD и помехи в сигнале. Интерфейс, который загружается, сканирует и расшифровывает.',
        fonts: 'Tektur + JetBrains Mono',
        palette: [
          { hex: '#08070D', name: 'Пустота' },
          { hex: '#00F0FF', name: 'Циан' },
          { hex: '#FF2E88', name: 'Маджента' },
          { hex: '#F5F200', name: 'Тревога' }
        ],
        radius: 'Срезанные углы под 45°',
        motion: 'Глитч, сканирование, посимвольная расшифровка',
        signature: 'Загрузка системы и HUD, который следит за курсором'
      }
    },

    hub: {
      eyebrow: 'Студия «Диапазон» · дизайн-эксперимент',
      title: 'Диапазон',
      lead: 'Одна и та же страница студии в пяти стилях. Тексты, разделы и порядок блоков одинаковые — меняются шрифты, цвета, сетка и поведение. Так сразу видно, насколько широко мы умеем звучать.',
      hint: 'Наведите на полосу, чтобы заглянуть внутрь. Нажмите, чтобы войти.',
      hintTouch: 'Нажмите на стиль, чтобы открыть страницу.',
      open: 'Открыть',
      keys: 'Клавиши 1–5 открывают стили',
      compare: {
        title: 'Пять дизайн-систем',
        lead: 'Контент один, решения разные. Вот из чего собран каждый стиль.',
        fonts: 'Шрифты',
        palette: 'Палитра',
        radius: 'Углы',
        motion: 'Движение',
        signature: 'Фишка'
      },
      how: {
        title: 'Как это устроено',
        items: [
          { title: 'Один источник текстов', text: 'Все пять страниц читают тексты из одного файла на двух языках — разойтись по содержанию они не могут физически.' },
          { title: 'Одни и те же якоря', text: 'Разделы совпадают до id. Переключаете стиль — и остаётесь на том же месте страницы, на том же языке.' },
          { title: 'Своя вёрстка у каждого', text: 'Это не перекрашенный шаблон: у каждого стиля своя сетка, типографика, анимации и поведение элементов.' }
        ]
      },
      cta: {
        title: 'Какой характер нужен вашему проекту?',
        text: 'Расскажите о задаче — предложим два направления на выбор.',
        button: 'Обсудить проект'
      },
      footer: '© 2026 Диапазон. Концепт-проект для портфолио.'
    }
  },

  en: {
    meta: {
      description: 'Diapason is a web design and development studio. One and the same page in five styles: brutalism, glassmorphism, retro ’90s, minimalism and cyberpunk.',
      hubTitle: 'Diapason — one site, five characters'
    },
    a11y: {
      skip: 'Skip to content',
      lang: 'Site language',
      dock: 'Styles of this page',
      menu: 'Menu',
      close: 'Close',
      current: 'current style',
      newWindow: 'opens in a new window'
    },
    brand: {
      name: 'Diapason',
      descriptor: 'web design studio',
      tagline: 'One brief — any character.'
    },
    lang: { ru: 'RU', en: 'EN', ruFull: 'Русский', enFull: 'English' },
    dock: {
      hub: 'All styles',
      keys: 'Keys 1–5',
      hubKey: '0 — hub'
    },
    nav: {
      items: [
        { href: '#services', label: 'Services' },
        { href: '#work', label: 'Work' },
        { href: '#process', label: 'Process' },
        { href: '#pricing', label: 'Pricing' },
        { href: '#faq', label: 'FAQ' },
        { href: '#contact', label: 'Contact' }
      ],
      cta: 'Start a project'
    },

    hero: {
      eyebrow: 'Web design and development studio',
      title: 'Websites with character.',
      lead: 'We build landing pages, company sites and web apps that people remember from the first screen. This page exists in five styles: same words — everything else changes.',
      ctaPrimary: 'Start a project',
      ctaSecondary: 'See our work',
      switchHint: 'Switch the style at the bottom of the screen or press 1–5',
      stats: [
        { value: '13', label: 'portfolio projects' },
        { value: '5', label: 'styles on this page' },
        { value: '48 h', label: 'to the first reply' },
        { value: '2', label: 'concepts to choose from' }
      ]
    },

    services: {
      num: '01',
      title: 'What we do',
      lead: 'We take the whole project — from the idea and the copy to launch. No templates, no site builders.',
      items: [
        { title: 'Landing pages', text: 'One page, one goal: a lead, a sale or a booking. With a wow moment on the very first screen.', meta: 'from 2 weeks' },
        { title: 'Company websites', text: 'Multi-page sites with a clear structure that your team can easily update.', meta: 'from 4 weeks' },
        { title: 'Online stores', text: 'Catalogue, cart, checkout and accounts. A storefront people actually want to linger in.', meta: 'from 6 weeks' },
        { title: 'Web apps and dashboards', text: 'Services, accounts and control panels: complex data turned into a simple interface.', meta: 'from 6 weeks' },
        { title: '3D and WebGL', text: 'Configurators, interactive scenes and effects that fly right in the browser and on phones.', meta: 'from 3 weeks' },
        { title: 'Identity and design systems', text: 'Logo, palette, type and components — so the brand looks the same everywhere.', meta: 'from 2 weeks' }
      ]
    },

    work: {
      num: '02',
      title: 'Selected work',
      lead: 'Six projects from the portfolio — each with a character of its own. Just like this page.',
      year: '2026',
      more: 'Six more projects — from a 3D room to a music visualizer — we’ll show you on a call.',
      items: [
        {
          name: 'Svetoten', motif: 'latte',
          type: 'Café-bistro · Nizhny Novgorod',
          text: 'The site runs on the café’s clock: at 6 pm daylight gives way to candles. You can stir the latte on the first screen and book a table on a live floor plan.',
          tags: ['WebGL', 'Booking', 'Next.js']
        },
        {
          name: 'Kadens', motif: 'pulse',
          type: 'Fitness club · Kazan',
          text: 'A club that beats to your pulse: tap it in, and the schedule shows your personal heart-rate zone for every class.',
          tags: ['Heart-rate zones', 'Online booking', 'Next.js']
        },
        {
          name: 'Kolibri Terminal', motif: 'route',
          type: 'Courier service dashboard',
          text: 'A dispatcher’s terminal: a live order feed, a city map, SLA alerts, a time machine and a command line.',
          tags: ['Dashboard', 'Live data', 'Canvas']
        },
        {
          name: 'DVOR 01', motif: 'sneaker',
          type: '3D sneaker configurator',
          text: 'Four models, a material and colour for every part, lettering on the heel — the pair is assembled in 3D right in the browser.',
          tags: ['Three.js', 'Configurator', 'E-commerce']
        },
        {
          name: 'Aelita', motif: 'orbit',
          type: 'Interplanetary lines · concept',
          text: 'Flights to the Moon, Mars and orbit: a 216-day route, a choice of cabins and a boarding pass at the end of the page.',
          tags: ['Landing page', 'Scrollytelling', '3D']
        },
        {
          name: 'Rovno', motif: 'ring',
          type: 'Budget tracker · PWA',
          text: 'Answers one question: how much can I spend today so the money lasts until payday. Works offline.',
          tags: ['PWA', 'Offline', 'UX']
        }
      ]
    },

    process: {
      num: '03',
      title: 'How we work',
      lead: 'Four steps and no surprises: you always know what is happening and when it will be ready.',
      steps: [
        { title: 'Brief', text: 'We get on a call and unpack the task, the audience and the competition. We fix the goal, budget and deadline.', duration: '1–2 days' },
        { title: 'Concept', text: 'We show two directions: palette, type, the first screen and the main wow moment. You choose.', duration: '3–5 days' },
        { title: 'Design and build', text: 'We build the whole site with real copy. Every week you get a live link to the latest version.', duration: '2–6 weeks' },
        { title: 'Launch', text: 'We test on phones and browsers, connect the domain and analytics. A month of support is on us.', duration: '1 week' }
      ]
    },

    pricing: {
      num: '04',
      title: 'What it costs',
      lead: 'A fixed price after the brief. 50% upfront, the rest after launch.',
      cta: 'Let’s talk',
      note: 'We name the exact estimate after the brief — free and with no strings attached.',
      plans: [
        {
          name: 'Landing page', price: 'from $1,200', term: '2–3 weeks', featured: false, badge: '',
          text: 'One page for one goal.',
          features: ['Concept in two directions', 'Responsive down to 375 px', 'Animation and micro-interactions', 'Lead form with notifications', 'Basic SEO setup']
        },
        {
          name: 'Company website', price: 'from $3,200', term: '4–6 weeks', featured: true, badge: 'Most popular',
          text: 'A multi-page site with an easy admin panel.',
          features: ['Up to 10 unique pages', 'Design system and UI kit', 'Blog or news with a CMS', 'Two languages', 'CRM integration']
        },
        {
          name: 'Web app', price: 'from $6,400', term: 'from 8 weeks', featured: false, badge: '',
          text: 'A service, store or dashboard with a backend.',
          features: ['User flow design', 'Accounts and roles', 'Database and API', 'Payments and notifications', 'Tests and maintenance']
        }
      ]
    },

    faq: {
      num: '05',
      title: 'Questions',
      lead: 'The short version of what people ask most.',
      items: [
        { q: 'How much does a website cost?', a: 'A landing page starts at $1,200, a company site at $3,200, a web app at $6,400. We fix the exact price after the brief, and it stays put as long as the task does.' },
        { q: 'How long does it take?', a: 'A landing page takes 2–3 weeks, a company site 4–6 weeks, an app from 8 weeks. Deadlines and milestones go into the contract.' },
        { q: 'Can you work in our brand style?', a: 'Of course. This page shows our range, but we work from your brand: we use your brand book if you have one, or build a visual language from scratch.' },
        { q: 'What do you need from us to start?', a: 'An hour for the brief, one person who makes decisions, and a few sites you like and dislike. We can write the copy ourselves.' },
        { q: 'Will the site work well on phones?', a: 'We design the mobile version alongside the desktop one and test on real devices. Heavy effects get lighter on phones rather than switched off.' },
        { q: 'What happens after launch?', a: 'A month of free support: fixes, small improvements, help with content. After that — if you like, hourly or on a retainer.' }
      ]
    },

    contact: {
      num: '06',
      title: 'Tell us about your project',
      lead: 'We’ll reply within 48 hours with questions and a rough budget. The brief commits you to nothing.',
      details: [
        { label: 'Where', value: 'Remote, worldwide' },
        { label: 'When', value: 'Mon–Fri, 10:00–19:00 GMT+3' },
        { label: 'Reply', value: 'Within 48 hours' }
      ],
      form: {
        name: { label: 'Your name', placeholder: 'Anna' },
        contact: { label: 'Email or Telegram', placeholder: 'anna@company.com or @anna' },
        type: { label: 'What you need', options: ['Landing page', 'Company website', 'Online store', 'Web app', '3D and WebGL', 'Not sure yet'] },
        budget: { label: 'Budget', options: ['under $2,000', '$2,000–5,000', '$5,000+', 'Let’s discuss'] },
        message: { label: 'A few words about the task', placeholder: 'For example: a landing page for a café, launching in March' },
        submit: 'Send request',
        sending: 'Sending…',
        privacy: 'By pressing the button you agree that we will reply. Nothing else.',
        success: {
          title: 'Got it!',
          text: 'Thank you, {name}. We’ll reply within 48 hours.',
          note: 'This is a demo form of a concept project: the request isn’t sent anywhere.',
          again: 'Send another one'
        },
        errors: {
          name: 'Tell us what to call you',
          contact: 'We need an email or a Telegram @handle'
        }
      }
    },

    footer: {
      colophon: 'How this page is made',
      fontsLabel: 'Type',
      paletteLabel: 'Palette',
      rights: '© 2026 Diapason. A portfolio concept project.',
      toTop: 'Back to top',
      hub: 'All five styles'
    },

    styles: {
      brutalism: {
        name: 'Brutalism', short: 'Brutal',
        hero: 'This one’s brutal.',
        metaTitle: 'Diapason — Brutalism',
        desc: 'Raw blocks, thick borders and honest type. Nothing hidden, nothing smoothed over.',
        fonts: 'Dela Gothic One + IBM Plex Mono',
        palette: [
          { hex: '#F2F0EB', name: 'Concrete' },
          { hex: '#000000', name: 'Black' },
          { hex: '#CCFF00', name: 'Acid' }
        ],
        radius: '0 px — right angles only',
        motion: 'Abrupt: instant swaps and hard offsets',
        signature: 'Price stickers you can drag around the page'
      },
      glassmorphism: {
        name: 'Glassmorphism', short: 'Glass',
        hero: 'This one’s made of glass.',
        metaTitle: 'Diapason — Glassmorphism',
        desc: 'Layers of frosted glass over living light. Depth, refraction at the edges and soft highlights.',
        fonts: 'Geologica',
        palette: [
          { hex: '#0B3C49', name: 'Deep sea' },
          { hex: '#2EC4B6', name: 'Lagoon' },
          { hex: '#FF7A45', name: 'Sunset' },
          { hex: '#FFC857', name: 'Sun' }
        ],
        radius: '28 px — soft droplets',
        motion: 'Fluid: springs and inertia',
        signature: 'Liquid glass refracts the light behind your cursor'
      },
      'retro-90s': {
        name: 'Retro ’90s', short: '’90s',
        hero: 'This one’s from 1997.',
        metaTitle: 'Diapason — Retro ’90s',
        desc: 'A dial-up era homepage: Windows 95 windows, a hit counter and MIDI in the background.',
        fonts: 'Times New Roman + Comic Sans MS + Press Start 2P',
        palette: [
          { hex: '#008080', name: 'Desktop teal' },
          { hex: '#C0C0C0', name: 'Win95 grey' },
          { hex: '#000080', name: 'Title bar navy' },
          { hex: '#0000EE', name: 'Link blue' }
        ],
        radius: '0 px with bevelled edges',
        motion: 'Blinking, marquees and a sparkle cursor trail',
        signature: 'Draggable windows and a chiptune you can switch on'
      },
      minimalism: {
        name: 'Minimalism', short: 'Minimal',
        hero: 'This one’s quiet.',
        metaTitle: 'Diapason — Minimalism',
        desc: 'Air, a grid and a single orange dot. Everything else is extra.',
        fonts: 'Manrope',
        palette: [
          { hex: '#F4F3EF', name: 'Paper' },
          { hex: '#141414', name: 'Ink' },
          { hex: '#8A8A85', name: 'Graphite' },
          { hex: '#FF4D1A', name: 'The dot' }
        ],
        radius: '0 px, 1 px hairlines',
        motion: 'Slow and exact: 600 ms, one easing curve',
        signature: 'A single line draws itself through the whole page'
      },
      cyberpunk: {
        name: 'Cyberpunk', short: 'Cyber',
        hero: 'This one’s from 2077.',
        metaTitle: 'Diapason — Cyberpunk',
        desc: 'Neon, HUD and signal noise. An interface that boots, scans and decrypts.',
        fonts: 'Tektur + JetBrains Mono',
        palette: [
          { hex: '#08070D', name: 'Void' },
          { hex: '#00F0FF', name: 'Cyan' },
          { hex: '#FF2E88', name: 'Magenta' },
          { hex: '#F5F200', name: 'Alert' }
        ],
        radius: '45° cut corners',
        motion: 'Glitch, scan lines, character-by-character decrypt',
        signature: 'A boot sequence and a HUD that tracks your cursor'
      }
    },

    hub: {
      eyebrow: 'Diapason studio · a design experiment',
      title: 'Diapason',
      lead: 'One and the same studio page in five styles. The copy, the sections and their order are identical — the type, colour, grid and behaviour change. So you can see at a glance how wide our range is.',
      hint: 'Hover a strip to peek inside. Click to enter.',
      hintTouch: 'Tap a style to open the page.',
      open: 'Open',
      keys: 'Keys 1–5 open the styles',
      compare: {
        title: 'Five design systems',
        lead: 'One content, different decisions. Here is what each style is made of.',
        fonts: 'Type',
        palette: 'Palette',
        radius: 'Corners',
        motion: 'Motion',
        signature: 'Signature'
      },
      how: {
        title: 'How it works',
        items: [
          { title: 'One source of copy', text: 'All five pages read their words from one bilingual file — they physically cannot drift apart.' },
          { title: 'The same anchors', text: 'Sections match down to the id. Switch the style and you stay in the same spot of the page, in the same language.' },
          { title: 'A layout of its own', text: 'Not a recoloured template: each style has its own grid, typography, animation and behaviour.' }
        ]
      },
      cta: {
        title: 'What character does your project need?',
        text: 'Tell us about the task — we’ll offer two directions to choose from.',
        button: 'Start a project'
      },
      footer: '© 2026 Diapason. A portfolio concept project.'
    }
  }
};
