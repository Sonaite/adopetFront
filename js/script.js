const API_URL = "http://localhost:8080";

// --- Funções Utilitárias ---

// Mostra mensagem bonita na tela
function showToast(message, type = 'success') {
    const toast = document.getElementById("toast");
    if(!toast) return;
    toast.className = `show ${type}`;
    toast.innerText = message;
    setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 3000);
}

// Verifica se o usuário está logado
function getUsuarioLogado() {
    const userStr = localStorage.getItem('usuarioAdopet');
    return userStr ? JSON.parse(userStr) : null;
}

// Atualiza o menu superior (Login vs Sair)
function atualizarMenu() {
    const navAuth = document.getElementById('nav-auth');
    const usuario = getUsuarioLogado();
    if (!navAuth) return;

    if (usuario) {
        navAuth.innerHTML = `

            
            <a href="index.html">Início</a>
            <a href="cadastro-animal.html">Quero Doar</a>
           <a href="solicitacoes-recebidas.html" style="position:relative">
    Solicitações
    <span id="badge-solicitacoes" class="badge" style="display:none">0</span>
</a>

             
            <a href="denuncia.html">Denúncia</a>
            <a href="perfil.html">Meu Perfil</a>
            <a href="#" onclick="logout()" class="btn-login">Sair</a>
        `;
    } else {
        navAuth.innerHTML = `
            <a href="index.html">Início</a>
            <a href="login.html" class="btn-login">Entrar / Criar Conta</a>
        `;
    }
}


// Logout
function logout() {
    localStorage.removeItem('usuarioAdopet');
    window.location.href = 'index.html';
}

// Protege rotas que precisam de login
function protegerPagina() {
    if (!getUsuarioLogado()) {
        alert("Você precisa estar logado para acessar esta página.");
        window.location.href = 'login.html';
    }
}

// --- Funções de API ---

// 1. Carregar Animais (Home)
async function carregarAnimais() {
    const grid = document.getElementById('lista-animais');
    if (!grid) return;

    grid.innerHTML = '<p>Buscando amigos...</p>';

    try {
        const response = await fetch(`${API_URL}/animais`);
        if (!response.ok) throw new Error('Falha ao buscar');
        const animais = await response.json();

        grid.innerHTML = '';
        
        if (animais.length === 0) {
            grid.innerHTML = '<p>Nenhum animal cadastrado ainda.</p>';
            return;
        }

        animais.forEach(animal => {
    const imgUrl = (animal.fotosUrls && animal.fotosUrls.length > 0)
        ? animal.fotosUrls[0]
        : 'https://placehold.co/400x300?text=Adopet';

    grid.innerHTML += `
        <div class="card">
            <img src="${imgUrl}" alt="${animal.nome}" class="card-img">
            <div class="card-body">
                <span class="card-tag">${animal.especie}</span>
                <h3 class="card-title">${animal.nome}</h3>
                <p class="card-info">${animal.raca} • ${animal.idade} anos</p>
                <p style="margin-bottom:15px; font-size:0.9rem">
                    ${animal.descricao || "Sem descrição."}
                </p>

                <a href="animal.html?id=${animal.id}" class="btn-adopt">
                    Ver detalhes
                </a>
            </div>
        </div>
    `;
});

    } catch (e) {
        console.error(e);
        grid.innerHTML = '<p style="color:red">Erro ao conectar com o servidor.</p>';
    }
}

// 2. Sistema de Login e Cadastro de Usuário

async function handleAuth(event, isLogin) {
    event.preventDefault();
    const form = event.target;
    const botao = form.querySelector('button');
    botao.disabled = true;
    botao.innerText = "Processando...";

    const dados = {};
    new FormData(form).forEach((value, key) => dados[key] = value);

    // Se for login, garantimos que só vai email e senha
    if (isLogin) {
        delete dados.nomeCompleto;
    }

    const endpoint = isLogin ? '/usuarios/login' : '/usuarios';

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        if (response.ok) {
            const resultado = await response.json();

            if (!isLogin) {
                showToast("Conta criada com sucesso! Faça login.", "success");
                toggleAuthMode();
            } else {
                localStorage.setItem('usuarioAdopet', JSON.stringify(resultado));
                window.location.href = 'index.html';
            }
        } else {
            showToast("Erro: Verifique os dados preenchidos.", "error");
        }
    } catch (error) {
        showToast("Erro de conexão com o servidor.", "error");
    } finally {
        botao.disabled = false;
        botao.innerText = isLogin ? "Entrar" : "Criar Conta";
    }
}


// 3. Cadastrar Animal
async function cadastrarAnimal(event) {
    event.preventDefault();
    
    const usuario = getUsuarioLogado();
    if (!usuario) return logout();

    const form = document.getElementById('form-animal');
    
    // Dados básicos
    const animalData = {
        nome: form.nome.value,
        especie: form.especie.value,
        raca: form.raca.value,
        idade: parseInt(form.idade.value),
        vacinado: form.vacinado.checked,
        castrado: form.castrado.checked,
        descricao: form.descricao.value,
        doadorId: usuario.id,
        fotosUrls: form.foto.value ? [form.foto.value] : [] 
    };

    try {
        const response = await fetch(`${API_URL}/animais`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(animalData)
        });

        if (response.ok) {
            alert("Animal cadastrado com sucesso!");
            window.location.href = 'index.html';
        } else {
            showToast("Erro ao cadastrar animal.", "error");
        }
    } catch (e) {
        showToast("Erro no servidor.", "error");
    }
}

function adotar(nomePet) {
    const usuario = getUsuarioLogado();
    if(!usuario) {
        showToast("Faça login para adotar!", "error");
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }
    alert(`Que legal, ${usuario.nome}! \n\nO pedido de adoção para o ${nomePet} foi enviado para o abrigo. Eles entrarão em contato pelo seu email: ${usuario.email}`);
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    atualizarMenu();
    carregarAnimais();
});



// ============================
// PERFIL DO USUÁRIO
// ============================

async function carregarPerfil() {
    protegerPagina();
    atualizarMenu();

    const usuario = getUsuarioLogado();

    try {
        const res = await fetch(`${API_URL}/usuarios/${usuario.id}`);
        if (!res.ok) throw new Error();

        const u = await res.json();

        document.getElementById("nomeCompleto").value = u.nomeCompleto || "";
        document.getElementById("email").value = u.email || "";
        document.getElementById("telefone").value = u.telefone || "";

        if (u.endereco) {
            document.getElementById("rua").value = u.endereco.rua || "";
            document.getElementById("numero").value = u.endereco.numero || "";
            document.getElementById("bairro").value = u.endereco.bairro || "";
            document.getElementById("cidade").value = u.endereco.cidade || "";
            document.getElementById("estado").value = u.endereco.estado || "";
            document.getElementById("cep").value = u.endereco.cep || "";
        }

    } catch (e) {
        showToast("Erro ao carregar perfil.", "error");
    }
}

async function salvarPerfil(e) {
    e.preventDefault();
    const usuario = getUsuarioLogado();

    const dados = {
        nomeCompleto: document.getElementById("nomeCompleto").value,
        telefone: document.getElementById("telefone").value,
        endereco: {
            rua: document.getElementById("rua").value,
            numero: document.getElementById("numero").value,
            bairro: document.getElementById("bairro").value,
            cidade: document.getElementById("cidade").value,
            estado: document.getElementById("estado").value,
            cep: document.getElementById("cep").value
        }
    };

    try {
        const res = await fetch(`${API_URL}/usuarios/${usuario.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados)
        });

        if (!res.ok) throw new Error();

        const atualizado = await res.json();
        localStorage.setItem("usuarioAdopet", JSON.stringify(atualizado));

        showToast("Perfil atualizado com sucesso!", "success");

    } catch (e) {
        showToast("Erro ao salvar perfil.", "error");
    }
}

async function alterarSenha(e) {
    e.preventDefault();
    const usuario = getUsuarioLogado();

    try {
        const res = await fetch(`${API_URL}/usuarios/${usuario.id}/senha`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                senhaAtual: document.getElementById("senhaAtual").value,
                novaSenha: document.getElementById("novaSenha").value
            })
        });

        if (!res.ok) throw new Error();

        showToast("Senha atualizada com sucesso!", "success");
        e.target.reset();

    } catch (e) {
        showToast("Erro ao atualizar senha.", "error");
    }
}


// ============================
// BUSCAR QTDD AUTOMÁTICA DE SOLICITAÇÕES (BADGE)
// ============================

async function carregarBadgeSolicitacoes() {
    const usuario = getUsuarioLogado();
    if (!usuario) return;

    try {
        const res = await fetch(
            `${API_URL}/adocoes/solicitacoes/doador/${usuario.id}`
        );
        if (!res.ok) return;

        const solicitacoes = await res.json();

        // conta apenas as pendentes
        const pendentes = solicitacoes.filter(
            s => s.status === "PENDENTE"
        );

        const badge = document.getElementById("badge-solicitacoes");
        if (!badge) return;

        if (pendentes.length > 0) {
            badge.innerText = pendentes.length;
            badge.style.display = "inline-block";
        } else {
            badge.style.display = "none";
        }

    } catch (e) {
        console.warn("Erro ao carregar badge de solicitações");
    }
}

// ============================
// INICIALIZAÇÃO GLOBAL
// ============================

document.addEventListener("DOMContentLoaded", () => {
    atualizarMenu();
    carregarAnimais();
    carregarBadgeSolicitacoes();
});
