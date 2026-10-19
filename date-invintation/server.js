                <small>Посмотрим что-нибудь красивое или создадим что-то сами</small>
              </button>
              <button class="option" data-action="category" data-kind="cinema">
                <strong>🎬 Поход в кино</strong>
                <small>Выберем фильм и устроимся поудобнее</small>
              </button>
              <button class="option" data-action="direct-category" data-title="Поход за книгами">
                <strong>📚 Поход за книгами</strong>
                <small>Поищем книжные сокровища</small>
              </button>
              <button class="option" data-action="direct-category" data-title="Поход по вещевым барахолкам">
                <strong>🧥 Поход по вещевым барахолкам</strong>
                <small>Вдруг найдём что-то совершенно особенное</small>
              </button>
            </div>
          </section>`;
      }

      if (state.page === "options") {
        const data = activities[state.activity];
        const optionsHtml = data.options.map((option, index) => `
          <div class="option">
            <strong>${escapeHtml(option.title)}</strong>
            ${option.subtitle ? `<small>${escapeHtml(option.subtitle)}</small>` : ""}
            ${option.url
              ? `<br><a class="choice-link" href="${option.url}" target="_blank" rel="noopener noreferrer">Подробнее</a>`
              : ""}
            <br><button data-action="select-plan" data-index="${index}">Выбрать</button>
          </div>
        `).join("");

        app.innerHTML = `
          <section class="card">
            <p class="eyebrow">отличный выбор</p>
            <h1>${escapeHtml(data.title)} 🌷</h1>
            <p class="description">Выбери вариант, который тебе нравится.</p>
            <div class="grid">${optionsHtml}</div>
            <a class="back" data-action="back-activities">← К выбору занятия</a>
          </section>`;
      }

      if (state.page === "meal") {
        const meals = ["Пицца", "Роллы", "Рамен", "Фьюжн"];
        app.innerHTML = `
          <section class="card">
            <p class="eyebrow">и последнее, но очень важное</p>
            <h1>Что будем есть? 🍓</h1>
            <p class="description">Выбери, чем начнём наш день.</p>
            <div class="summary">
              <strong>Наш план:</strong><br>
              📅 Суббота, 24 октября 2026<br>
              ✨ ${escapeHtml(state.plan)}
            </div>
            <div class="grid food-grid">
              ${meals.map(meal => `
                <button class="option ${state.meal === meal ? "selected" : ""}"
                        data-action="select-meal" data-meal="${meal}">
                  ${meal}
                </button>
              `).join("")}
            </div>
            <div class="footer-actions">
              <button data-action="send" ${state.meal ? "" : "disabled"}>
                Отправить мой выбор 💌
              </button>
            </div>
            <div class="message" id="message" aria-live="polite"></div>
            <a class="back" data-action="back-activities">← Изменить занятие</a>
          </section>`;
      }

      if (state.page === "done") {
        app.innerHTML = `
          <section class="card">
            <p class="eyebrow">уже жду! 💗</p>
            <h1>Наш план сохранён</h1>
            <p class="description">Выбор отправлен. Теперь осталось дождаться субботы!</p>
            <div class="summary">
              📅 Суббота, 24 октября 2026<br>
              ✨ ${escapeHtml(state.plan)}<br>
              🍽️ ${escapeHtml(state.meal)}
            </div>
            <div style="font-size:2.4rem">💕 💌 💕</div>
          </section>`;
      }

      attachNoButton();
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;",
        '"': "&quot;", "'": "&#039;"
      })[char]);
    }

    function attachNoButton() {
      const button = document.querySelector(".btn-no");
      if (!button) return;

      button.addEventListener("pointerenter", evade);
      button.addEventListener("touchstart", event => {
        event.preventDefault();
        evade();
      }, { passive: false });
      button.addEventListener("click", event => {
        event.preventDefault();
        evade();
      });
    }

    function evade() {
      const button = document.querySelector(".btn-no");
      if (!button) return;

      button.classList.add("escaping");
      const margin = 16;
      const maxX = Math.max(margin, window.innerWidth - button.offsetWidth - margin);
      const maxY = Math.max(margin, window.innerHeight - button.offsetHeight - margin);
      button.style.left = `${margin + Math.random() * (maxX - margin)}px`;
      button.style.top = `${margin + Math.random() * (maxY - margin)}px`;
    }

    app.addEventListener("click", async event => {
      const control = event.target.closest("[data-action]");
      if (!control) return;

      const action = control.dataset.action;

      if (action === "date-yes") {
        state.page = "together";
        render();
      } else if (action === "together-yes") {
        state.page = "activities";
        render();
      } else if (action === "category") {
        state.activity = activities[control.dataset.kind].title;
        state.page = "options";
        state.activityKey = control.dataset.kind;
        render();
      } else if (action === "direct-category") {
        state.activity = control.dataset.title;
        state.plan = control.dataset.title;
        state.page = "meal";
        render();
      } else if (action === "select-plan") {
        const option = activities[state.activityKey].options[Number(control.dataset.index)];
        state.plan = `${activities[state.activityKey].title}: ${option.title}`;
        state.page = "meal";
        render();
      } else if (action === "select-meal") {
        state.meal = control.dataset.meal;
        render();
      } else if (action === "back-activities") {
        state.page = "activities";
        render();
      } else if (action === "send") {
        await sendChoice();
      }
    });

    async function sendChoice() {
      const message = document.querySelector("#message");
      const sendButton = document.querySelector('[data-action="send"]');
      sendButton.disabled = true;
      message.textContent = "Отправляю…";

      try {
        const response = await fetch("/api/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: "Суббота, 24 октября 2026",
            activity: state.activity,
            plan: state.plan,
            meal: state.meal
          })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Не удалось отправить письмо");

        state.page = "done";
        render();
      } catch (error) {
        message.textContent = error.message;
        sendButton.disabled = false;
      }
    }

    function makeHearts() {
      const symbols = ["♥️", "♡", "💕"];
      for (let i = 0; i < 16; i++) {
        const heart = document.createElement("span");
        heart.className = "heart";
        heart.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        heart.style.left = `${Math.random() * 100}%`;
        heart.style.fontSize = `${14 + Math.random() * 22}px`;
        heart.style.animationDuration = `${9 + Math.random() * 12}s`;
        heart.style.animationDelay = `${Math.random() * 12}s`;
        document.body.appendChild(heart);
      }
    }

    makeHearts();
    render();
  </script>
</body>
</html>
