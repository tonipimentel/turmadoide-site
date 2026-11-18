// Os movimentos das páginas de divulgação (index.html e historias.html) que o CSS sozinho não faz.
// Sem este arquivo, a página aparece inteira e parada, e todos os links funcionam do mesmo jeito.
(function () {
  var semMovimento = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // As seções entram subindo quando chegam na tela: o cabeçalho e os cartões, um depois do outro.
  // Quem pediu menos movimento no sistema (ou um navegador sem IntersectionObserver) vê tudo já no lugar.
  if (!semMovimento && "IntersectionObserver" in window) {
    var alvos = document.querySelectorAll(
      "main section .section-head, main .grid > li, main .closing, main .catalog h2"
    );
    var observador = new IntersectionObserver(
      function (entradas) {
        entradas.forEach(function (entrada) {
          if (!entrada.isIntersecting) return;
          observador.unobserve(entrada.target);
          // "visto" sai no fim da entrada; "apareceu" fica (o Ide do fim pula duas vezes ao chegar).
          entrada.target.classList.add("visto", "apareceu");
        });
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    Array.prototype.forEach.call(alvos, function (alvo) {
      if (alvo.matches(".grid > li")) {
        var ordem = Array.prototype.indexOf.call(alvo.parentElement.children, alvo);
        alvo.style.setProperty("--atraso", Math.min(ordem % 4, 3) * 80 + "ms");
      }
      alvo.setAttribute("data-revelar", "");
      // Terminada a entrada, o elemento volta ao normal: assim o :hover dele (que também mexe no
      // transform) não fica preso atrás da animação.
      alvo.addEventListener("animationend", function fim(evento) {
        if (evento.target !== alvo) return;
        alvo.removeAttribute("data-revelar");
        alvo.classList.remove("visto");
        alvo.style.removeProperty("--atraso");
        alvo.removeEventListener("animationend", fim);
      });
      observador.observe(alvo);
    });
    document.documentElement.classList.add("revelar");
  }

  // A turma: no mouse, o CSS faz o personagem pular (:hover); no toque, a classe .pulando dá um pulo e o deixa
  // comemorando, até tocar em outro (que pula no lugar dele) ou, com mouse, até o ponteiro sair do cartão.
  var turma = document.querySelectorAll(".turma > li");
  Array.prototype.forEach.call(turma, function (item) {
    item.addEventListener("click", function () {
      Array.prototype.forEach.call(turma, function (outro) { outro.classList.remove("pulando"); });
      void item.offsetWidth; // recomeça o pulo, se for o mesmo personagem de novo
      item.classList.add("pulando");
    });
    item.addEventListener("pointerleave", function (evento) {
      if (evento.pointerType === "mouse") item.classList.remove("pulando");
    });
  });

  // Uma história com o episódio num .mp4 (o href do cartão com data-episodio) toca numa janela, sem sair
  // da página. Com o link para os pais, o cartão é um link comum e abre a página do episódio.
  var ARQUIVO = /\.(mp4|webm)(\?.*)?$/i;
  Array.prototype.forEach.call(document.querySelectorAll("a.story[data-episodio]"), function (cartao) {
    if (!ARQUIVO.test(cartao.getAttribute("href") || "")) return;
    cartao.addEventListener("click", function (evento) {
      if (typeof HTMLDialogElement !== "function") return; // navegador antigo: o link abre o vídeo
      evento.preventDefault();
      tocar(cartao.href, cartao.querySelector("strong").textContent, cartao.querySelector("img").src);
    });
  });

  function tocar(endereco, titulo, capa) {
    var janela = document.createElement("dialog");
    janela.className = "player";
    janela.setAttribute("aria-label", "Episódio: " + titulo);
    var fechar = document.createElement("button");
    fechar.type = "button";
    fechar.className = "player-fechar";
    fechar.setAttribute("aria-label", "Fechar o vídeo");
    fechar.innerHTML =
      '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    var video = document.createElement("video");
    video.src = endereco;
    video.poster = capa;
    video.controls = true;
    video.playsInline = true;
    video.autoplay = true;
    janela.append(fechar, video);
    document.body.append(janela);
    fechar.addEventListener("click", function () { janela.close(); });
    janela.addEventListener("click", function (evento) {
      if (evento.target === janela) janela.close(); // o clique fora do vídeo (no fundo escuro)
    });
    janela.addEventListener("close", function () { janela.remove(); });
    janela.showModal();
  }
})();
