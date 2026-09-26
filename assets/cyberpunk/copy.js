/*
 * Diapason — 05 · Cyberpunk: style-specific copy (boot log, HUD, hologram, data shards, terminal form).
 * Namespace x.cyberpunk, both languages, same array lengths.
 */
window.DIAPASON_EXTRA = window.DIAPASON_EXTRA || [];
window.DIAPASON_EXTRA.push({
  ru: {
    x: {
      cyberpunk: {
        boot: {
          title: 'холодный старт',
          lines: [
            { t: 'подключаем нейроинтерфейс', s: 'OK' },
            { t: 'прогреваем неон: циан, маджента, жёлтый', s: 'OK' },
            { t: 'расшифровываем тексты RU/EN', s: 'OK' },
            { t: 'ищем шаблоны', s: '0 найдено' },
            { t: 'калибруем вкус', s: '100%' },
            { t: 'рукопожатие с клиентом', s: 'ждём вас' }
          ],
          loading: 'Загрузка системы',
          granted: 'Доступ разрешён',
          skip: 'Любая клавиша или клик — пропустить'
        },
        status: { online: 'В сети', node: 'Узел' },
        hud: { sector: 'Сектор', top: 'Вход', lock: 'Захват', depth: 'Глубина', time: 'Время' },
        holo: {
          obj: 'Объект: камертон',
          freq: 'Ля первой октавы · 440 Гц',
          amp: 'Амплитуда',
          hintMouse: 'Щёлкните — и он зазвенит',
          hintTouch: 'Коснитесь — и он зазвенит'
        },
        services: { installed: 'Установлено модулей', eta: 'Срок' },
        shard: { status: 'Статус' },
        shards: [
          { id: 'SVT-01', status: 'развёрнут' },
          { id: 'KDN-02', status: 'развёрнут' },
          { id: 'KLB-03', status: 'в эфире' },
          { id: 'DVR-04', status: 'развёрнут' },
          { id: 'AEL-05', status: 'концепт' },
          { id: 'RVN-06', status: 'работает офлайн' }
        ],
        process: { stage: 'Этап', pipeline: 'Конвейер проекта' },
        tier: 'Уровень доступа',
        eta: 'Срок',
        faq: { session: 'сеанс открыт', count: 'запросов' },
        form: {
          channel: 'Защищённый канал',
          enc: 'шифрование включено',
          idle: 'Ожидаю ввод',
          done: 'Передача завершена',
          packet: 'Пакет',
          error: 'Ошибка'
        },
        contact: { channel: 'Канал связи' },
        footer: { eot: 'Конец передачи' }
      }
    }
  },
  en: {
    x: {
      cyberpunk: {
        boot: {
          title: 'cold boot',
          lines: [
            { t: 'jacking into the neural interface', s: 'OK' },
            { t: 'warming up the neon: cyan, magenta, yellow', s: 'OK' },
            { t: 'decrypting copy RU/EN', s: 'OK' },
            { t: 'scanning for templates', s: '0 found' },
            { t: 'calibrating taste', s: '100%' },
            { t: 'client handshake', s: 'awaiting you' }
          ],
          loading: 'System loading',
          granted: 'Access granted',
          skip: 'Press any key or click to skip'
        },
        status: { online: 'Online', node: 'Node' },
        hud: { sector: 'Sector', top: 'Entry', lock: 'Lock', depth: 'Depth', time: 'Time' },
        holo: {
          obj: 'Object: tuning fork',
          freq: 'A4 · 440 Hz',
          amp: 'Amplitude',
          hintMouse: 'Click it — watch it ring',
          hintTouch: 'Tap it — watch it ring'
        },
        services: { installed: 'Modules installed', eta: 'ETA' },
        shard: { status: 'Status' },
        shards: [
          { id: 'SVT-01', status: 'deployed' },
          { id: 'KDN-02', status: 'deployed' },
          { id: 'KLB-03', status: 'live' },
          { id: 'DVR-04', status: 'deployed' },
          { id: 'AEL-05', status: 'concept' },
          { id: 'RVN-06', status: 'offline-ready' }
        ],
        process: { stage: 'Stage', pipeline: 'Project pipeline' },
        tier: 'Access tier',
        eta: 'ETA',
        faq: { session: 'session open', count: 'queries' },
        form: {
          channel: 'Secure channel',
          enc: 'encryption on',
          idle: 'Awaiting input',
          done: 'Transmission complete',
          packet: 'Packet',
          error: 'Error'
        },
        contact: { channel: 'Comms channel' },
        footer: { eot: 'End of transmission' }
      }
    }
  }
});
