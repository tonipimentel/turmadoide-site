// Os planos da página principal, como o /admin deixou: o nome, o preço, os episódios, o baixar e a marca d'água
// de cada plano à mostra, e o preço do avulso. Vêm do app (GET /api/vitrine, o endereço no data-vitrine da lista) e
// refazem os cartões escritos no index.html; sem resposta do app, ficam os escritos.
(function () {
  var lista = document.querySelector(".plans[data-vitrine]");
  if (!lista || !window.fetch) return;
  var endereco = lista.getAttribute("data-vitrine");
  var app = "https://app.turmadoide.com.br";
  try { if (/^https?:/.test(endereco)) app = new URL(endereco).origin; } catch (erro) { /* fica o padrão */ }

  var CERTO =
    '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  var POR_DOMINGO = { 1: "um", 2: "dois", 3: "três", 4: "quatro" };

  var parar = typeof AbortController === "function" ? new AbortController() : null;
  var prazo = parar ? setTimeout(function () { parar.abort(); }, 6000) : null;
  fetch(endereco, { credentials: "omit", signal: parar ? parar.signal : undefined })
    .then(function (resposta) {
      if (!resposta.ok) throw new Error("vitrine " + resposta.status);
      return resposta.json();
    })
    .then(montar)
    .catch(function () { /* o app fora do ar ou lento: ficam os planos escritos na página */ })
    .then(function () { clearTimeout(prazo); });

  function montar(vitrine) {
    var planos = (vitrine && vitrine.plans) || [];
    if (!planos.length) return;
    var cartoes = {};
    Array.prototype.forEach.call(lista.children, function (li) { cartoes[li.getAttribute("data-plano")] = li; });

    var ordem = planos.map(function (plano) {
      var li = cartoes[plano.key];
      if (!li) { // um plano novo do /admin
        li = document.createElement("li");
        li.className = "card plan";
        li.setAttribute("data-plano", plano.key);
      }
      li.innerHTML = conteudo(plano, li.classList.contains("featured"));
      return li;
    });

    var avulso = cartoes.avulso;
    var precos = ((vitrine.avulsos || []).map(function (a) { return a.price; })).filter(function (p) { return p > 0; });
    if (avulso && precos.length) {
      avulso.querySelector(".price").innerHTML =
        (precos.length > 1 ? "a partir de " : "") + reais(Math.min.apply(null, precos)) + " <small>por episódio</small>";
    }
    if (avulso) ordem.push(avulso);

    // Põe na ordem do app (o Grátis, depois do mais barato ao mais caro, e o avulso no fim), mexendo só no
    // que mudou de lugar, e tira os cartões dos planos que o /admin escondeu.
    var aqui = lista.firstElementChild;
    ordem.forEach(function (li) {
      if (li === aqui) aqui = aqui.nextElementSibling;
      else lista.insertBefore(li, aqui);
    });
    Array.prototype.slice.call(lista.children).forEach(function (li) {
      if (ordem.indexOf(li) < 0) li.remove();
    });
  }

  function conteudo(plano, destaque) {
    var pago = plano.price > 0;
    var link = pago ? app + "/planos?plano=" + encodeURIComponent(plano.key) + "&criar" : app + "/?criar";
    return (
      "<h3>" + texto(plano.name) + "</h3>" +
      '<div class="price">' + (pago ? reais(plano.price) + " <small>por mês</small>" : "R$ 0") + "</div>" +
      "<p>" + episodios(plano) + "</p>" +
      (plano.download === false
        ? '<p class="plan-baixar">Assista no app; baixe só os episódios prontos</p>'
        : '<p class="plan-baixar" data-baixa>' + CERTO + "Baixe os vídeos</p>") +
      (plano.watermark
        ? '<p class="plan-marca">Com a marca d\'água turmadoide.com.br</p>'
        : '<p class="plan-marca" data-sem-marca>' + CERTO + "Sem marca d'água</p>") +
      '<a class="button' + (destaque ? " button-primary" : "") + ' plan-cta" href="' + texto(link) + '">' +
      (pago ? "Assinar o " + texto(plano.name) : "Começar grátis") + "</a>"
    );
  }

  // "3 episódios nos 30 primeiros dias, depois 1 por mês", "5 episódios por mês", "8 episódios por mês, dois por domingo"
  function episodios(plano) {
    if (plano.first_month !== plano.monthly) {
      return quantos(plano.first_month) + " nos 30 primeiros dias, depois " + plano.monthly + " por mês";
    }
    var linha = quantos(plano.monthly) + " por mês";
    var domingos = plano.monthly / 4;
    return POR_DOMINGO[domingos] ? linha + ", " + POR_DOMINGO[domingos] + " por domingo" : linha;
  }

  function quantos(n) { return n + (n === 1 ? " episódio" : " episódios"); }

  function reais(centavos) {
    var inteiro = Math.floor(centavos / 100), resto = centavos % 100;
    return "R$ " + inteiro.toLocaleString("pt-BR") + "," + (resto < 10 ? "0" : "") + resto;
  }

  function texto(valor) {
    return String(valor).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
})();
