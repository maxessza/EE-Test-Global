(() => {
  const TOTAL = 80;
  const $ = id => document.getElementById(id);
  const screens = [$('home-screen'), $('quiz-screen'), $('result-screen')];
  let round = [];
  let selected = [];
  let cursor = 0;
  let lastResults = [];

  const shuffle = items => {
    const copy = items.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  function show(which) {
    screens.forEach((screen, index) => screen.classList.toggle('hidden', index !== which));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function answeredCount() {
    return selected.filter(answer => answer !== null).length;
  }

  function startRound() {
    round = shuffle(window.QUESTION_BANK).slice(0, TOTAL);
    selected = Array(TOTAL).fill(null);
    cursor = 0;
    renderQuestion();
    show(1);
  }

  function renderQuestion() {
    const question = round[cursor];
    $('progress-label').textContent = `ข้อ ${cursor + 1} จาก ${TOTAL}`;
    $('answered-label').textContent = `ตอบแล้ว ${answeredCount()} / ${TOTAL}`;
    $('progress-bar').style.width = `${((cursor + 1) / TOTAL) * 100}%`;
    $('question-source').textContent = question.source;
    $('question-number').textContent = `QUESTION ${String(cursor + 1).padStart(2, '0')}`;
    $('question-text').textContent = question.question;

    const list = $('options-list');
    list.replaceChildren();
    question.options.forEach((choice, index) => {
      const label = document.createElement('label');
      label.className = `option${selected[cursor] === index ? ' selected' : ''}`;

      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'answer';
      input.value = String(index);
      input.checked = selected[cursor] === index;
      input.addEventListener('change', () => {
        selected[cursor] = index;
        renderQuestion();
      });

      const letter = document.createElement('span');
      letter.className = 'option-letter';
      letter.textContent = `${String.fromCharCode(65 + index)}.`;

      const text = document.createElement('span');
      text.className = 'option-text';
      text.textContent = choice;
      label.append(input, letter, text);
      list.append(label);
    });

    $('prev-button').disabled = cursor === 0;
    $('next-button').textContent = cursor === TOTAL - 1 ? 'ข้อสุดท้าย' : 'ข้อถัดไป →';
    renderGrid();
  }

  function renderGrid() {
    const grid = $('question-grid');
    grid.replaceChildren();
    round.forEach((_, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `grid-button${selected[index] !== null ? ' answered' : ''}${index === cursor ? ' current' : ''}`;
      button.textContent = String(index + 1);
      button.setAttribute('aria-label', `ไปข้อ ${index + 1}`);
      button.setAttribute('aria-current', index === cursor ? 'step' : 'false');
      button.addEventListener('click', () => {
        cursor = index;
        renderQuestion();
      });
      grid.append(button);
    });
  }

  function finishRound() {
    const missing = TOTAL - answeredCount();
    if (missing && !window.confirm(`ยังไม่ได้ตอบ ${missing} ข้อ ต้องการส่งคำตอบตอนนี้หรือไม่?`)) return;

    lastResults = round.map((question, index) => ({
      question,
      chosen: selected[index],
      number: index + 1,
      isCorrect: selected[index] === question.answer
    }));
    const correct = lastResults.filter(result => result.isCorrect).length;
    const wrong = TOTAL - correct;
    const percentage = Math.round((correct / TOTAL) * 100);

    $('score-value').textContent = correct;
    $('correct-count').textContent = correct;
    $('wrong-count').textContent = wrong;
    $('percent-count').textContent = `${percentage}%`;
    $('score-ring').style.setProperty('--score', `${percentage}%`);
    $('result-message').textContent = percentage >= 85 ? 'ยอดเยี่ยมมาก' : percentage >= 65 ? 'ไปได้ดี ฝึกต่ออีกนิด' : 'เริ่มเห็นจุดที่ควรทบทวนแล้ว';
    $('result-detail').textContent = `คุณตอบถูก ${correct} จาก ${TOTAL} ข้อ รอบนี้สุ่มจากคลังทั้งหมด ${window.QUESTION_BANK.length} ข้อ`;

    $('wrong-filter-count').textContent = wrong;
    $('correct-filter-count').textContent = correct;
    $('all-filter-count').textContent = TOTAL;
    renderReview('wrong');

    try {
      const history = JSON.parse(localStorage.getItem('ga-practice-history') || '[]');
      history.push({ score: correct, at: new Date().toISOString() });
      localStorage.setItem('ga-practice-history', JSON.stringify(history.slice(-20)));
    } catch (_) {}

    show(2);
    updateHistory();
  }

  function addAnswerLine(card, labelText, answerText, className) {
    const line = document.createElement('div');
    line.className = `review-answer ${className}`;
    const label = document.createElement('span');
    label.className = 'review-answer-label';
    label.textContent = labelText;
    const value = document.createElement('span');
    value.className = 'review-answer-value';
    value.textContent = answerText;
    line.append(label, value);
    card.append(line);
  }

  function renderReview(filter = 'wrong') {
    const root = $('review-list');
    const correct = lastResults.filter(result => result.isCorrect);
    const wrong = lastResults.filter(result => !result.isCorrect);
    const results = filter === 'all' ? lastResults : filter === 'correct' ? correct : wrong;

    document.querySelectorAll('[data-review-filter]').forEach(button => {
      const active = button.dataset.reviewFilter === filter;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    $('review-summary').textContent = filter === 'wrong'
      ? `กำลังแสดงข้อผิด ${wrong.length} ข้อ · แตะ “ข้อถูก” เพื่อทบทวนข้อที่ตอบได้`
      : filter === 'correct'
        ? `กำลังแสดงข้อถูก ${correct.length} ข้อ`
        : `กำลังแสดงทั้งหมด ${lastResults.length} ข้อ เรียงตามลำดับที่ทำ`;

    root.replaceChildren();
    if (!results.length) {
      const empty = document.createElement('div');
      empty.className = 'review-empty';
      empty.textContent = filter === 'wrong' ? 'เยี่ยมมาก รอบนี้ตอบถูกทุกข้อ เลือก “ข้อถูก” หากต้องการอ่านคำอธิบายทบทวน' : 'ยังไม่มีข้อในหมวดนี้';
      root.append(empty);
      return;
    }

    results.forEach(({ question, chosen, number, isCorrect }) => {
      const card = document.createElement('article');
      card.className = `review-item ${isCorrect ? 'review-correct' : 'review-wrong'}`;

      const header = document.createElement('div');
      header.className = 'review-item-head';
      const numberLabel = document.createElement('span');
      numberLabel.className = 'review-number';
      numberLabel.textContent = `ข้อ ${number}`;
      const status = document.createElement('span');
      status.className = `review-status ${isCorrect ? 'status-correct' : 'status-wrong'}`;
      status.textContent = isCorrect ? '✓ ตอบถูก' : '✕ ควรทบทวน';
      const source = document.createElement('span');
      source.className = 'review-source';
      source.textContent = question.source;
      header.append(numberLabel, status, source);
      card.append(header);

      const title = document.createElement('h3');
      title.textContent = question.question;
      card.append(title);

      if (isCorrect) {
        const answer = `${String.fromCharCode(65 + question.answer)}. ${question.options[question.answer]}`;
        addAnswerLine(card, 'คำตอบของคุณ · ถูกต้อง', answer, 'review-answer-correct');
      } else {
        const chosenText = chosen === null
          ? 'เว้นคำตอบ'
          : `${String.fromCharCode(65 + chosen)}. ${question.options[chosen]}`;
        const answer = `${String.fromCharCode(65 + question.answer)}. ${question.options[question.answer]}`;
        addAnswerLine(card, 'คำตอบของคุณ', chosenText, 'review-answer-wrong');
        addAnswerLine(card, 'คำตอบที่ถูก', answer, 'review-answer-correct');
      }

      const explanation = document.createElement('div');
      explanation.className = 'explanation-block';
      const explanationTitle = document.createElement('h4');
      explanationTitle.textContent = 'อธิบายเฉลย';
      const explanationText = document.createElement('p');
      explanationText.textContent = window.QUESTION_EXPLANATIONS_TH?.[question.id] || question.explanationTh || 'ยังไม่มีคำอธิบายภาษาไทยสำหรับข้อนี้';
      explanation.append(explanationTitle, explanationText);
      card.append(explanation);
      root.append(card);
    });
  }

  function updateHistory() {
    try {
      const history = JSON.parse(localStorage.getItem('ga-practice-history') || '[]');
      if (!history.length) return;
      const best = Math.max(...history.map(item => item.score));
      $('history-line').textContent = `ทำแล้ว ${history.length} รอบ · คะแนนสูงสุด ${best} / 80`;
    } catch (_) {}
  }

  $('start-button').addEventListener('click', startRound);
  $('new-round-button').addEventListener('click', startRound);
  $('prev-button').addEventListener('click', () => {
    if (cursor > 0) {
      cursor--;
      renderQuestion();
    }
  });
  $('next-button').addEventListener('click', () => {
    if (cursor < TOTAL - 1) {
      cursor++;
      renderQuestion();
    }
  });
  $('submit-button').addEventListener('click', finishRound);
  $('quit-button').addEventListener('click', () => {
    if (window.confirm('ออกจากรอบนี้และเริ่มใหม่ภายหลังหรือไม่? คำตอบรอบนี้จะไม่ถูกบันทึก')) show(0);
  });
  $('review-filters').addEventListener('click', event => {
    const button = event.target.closest('[data-review-filter]');
    if (button) renderReview(button.dataset.reviewFilter);
  });

  updateHistory();
})();
