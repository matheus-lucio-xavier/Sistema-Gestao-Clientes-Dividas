import { useEffect, useState, useReducer, useMemo } from "react";
import { listarClientes, salvarCliente, getClienteById, deleteCliente } from "../../services/clienteService";
import Modal from "../../components/Modal";

const tamPagina = 9;

export default function ClientePage() {
    const [clientes, setClientes] = useState([]);

    const [lixeira, setLixeira] = useState([]);

    const [search, setSearch] = useState("");

    const [open, setOpen] = useState(false);

    const [abriLixeira, setAbrirLixeira] = useState(false)

    const [selected, setSelected] = useState(null);

    const [erros, setErros] = useState([]);

    const [apagar, setApagar] = useState()

    const [cpf, setCpf] = useReducer(
        (oldValue, newValue) => {
            if (newValue) {
                const apenasDigitos =
                    newValue.replace(/[^\d]/g, "").substr(-11);
                const valorMascarado = apenasDigitos
                    .replace(/(\d{3})(\d)/, "$1.$2")
                    .replace(/(\d{3})(\d)/, "$1.$2")
                    .replace(/(\d{3})(\d{2})$/, "$1-$2");
                return valorMascarado;
            }
        }, "");

    const params = new URLSearchParams(window.location.search);

    const [paginaAtual, setPaginaAtual] = useState(1);

    const [paginaAtualLixeira, setPaginaAtualLixeira] = useState(1);
    
    const clientesAtual = useMemo(() => {
        const primeiroIdx = (paginaAtual - 1) * tamPagina;
        const ultimoIdx = primeiroIdx + tamPagina;
        return clientes.slice(primeiroIdx, ultimoIdx);
    }, [paginaAtual, clientes]);

    const totalPaginas = Math.ceil(clientes.length / tamPagina);

    const lixeiraAtual = useMemo(() => {
        const primeiroIdx = (paginaAtualLixeira - 1) * tamPagina;
        const ultimoIdx = primeiroIdx + tamPagina;
        return lixeira.slice(primeiroIdx, ultimoIdx);
    }, [paginaAtualLixeira, lixeira]);

    const paginasLixeira = Math.ceil(lixeira.length / tamPagina);

    const fetchData = async () => {
        const resultado = await listarClientes(search);
        const resultado2 = await listarClientes(search, true)
        if (resultado.status == 200) {
            setClientes(resultado.data);
        }
        if (resultado2.status == 200) {
            setLixeira(resultado2.data)
        }
    }

    const submitForm = async (event) => {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);

        if (apagar == 1) {
            if (selected) {
                if (selected.ativo == false) {
                    const deleta = await deleteCliente(selected.id)
                    if (deleta.status == 200){
                        fetchData();
                        setApagar(0)
                        setOpen(false);
                        return null;
                    }else {
                        if (resultado.status == 422) {
                            setErros(resultado.data);
                        }
                    }
                }
            }
        }
        var ativo = true
        if (apagar == 0) {ativo = true}
        if (apagar == 1) {ativo = false}
        if (apagar == 2) {ativo = selected?.ativo}

        const cliente = {
            nome: formData.get("nome"),
            email: formData.get("email"),
            cpf: formData.get("cpf"),
            dataNascimento: formData.get("data-nascimento"),
            ativo: ativo
        };
        if (selected?.id) {
            cliente.id = selected.id;
        }
        const resultado = await salvarCliente(cliente);
        if (resultado.status == 200) {
            setOpen(false);
            fetchData();
        }else {
            if (resultado.status == 422) {
                setErros(resultado.data);
            }
        }

        form.reset(); 
        setApagar(0);
    }

    useEffect(() => {
        var timeout = setTimeout(() => {
            fetchData();
        }, 500);

        return () => {
            clearTimeout(timeout);
        }
    }, [search]);

    useEffect(() => {
        var timeout = setTimeout(() => {
            setErros([]);
        }, 5000);

        return () => {
            clearTimeout(timeout);
        }
    }, [erros]);

    useEffect(() => {
        if (selected) {
            setCpf(selected.cpf);
        } else {
            setCpf("");
        }
    }, [selected])

    const selecionarLinha = async (cliente) => {
        const resultado = await getClienteById(cliente.id);
        if (resultado.status == 200) {
            setSelected(resultado.data);
            setOpen(true);
        }
    };

    return <div>
        <h1>Clientes</h1>

        <div className="row-end">
            <button type="button" onClick={() => {
                setAbrirLixeira(true);
            }}>Abrir Lixeira</button>
        </div>

        <div className="row">
            <label>Pesquisa: </label>
            <input type="search"
                value={search}
                onChange={(e) =>
                    setSearch(e.target.value)
                } />

            <button type="button" onClick={() => {
                setOpen(true);
                setSelected(null);
                setCpf("");
            }}>Novo Cliente</button>
        </div>
        <div className="grid-cards">
            {clientesAtual.map(cliente =>
                <ClienteCard key={cliente.id} cliente={cliente} onClick={() => selecionarLinha(cliente)}></ClienteCard>)}

            {
                clientesAtual.length === 0 && (
                    <div className="empty-state">
                        Nenhum cliente encontrado.
                    </div>
                )
            }
        </div>

        <div className="pagination">
            <button
                onClick={() => setPaginaAtual(p => Math.max(p - 1, 1))}
                disabled={paginaAtual === 1}>
                ← Anterior
            </button>
            {[...Array(totalPaginas)].map((_, idx) => {
                const page = idx + 1;
                return (
                    <button
                    key={page}
                    onClick={() => setPaginaAtual(page)}
                    style={{
                        fontWeight: page === paginaAtual ? 'bold' : 'normal',
                        filter: page === paginaAtual ? 'brightness(0.5)' : 'brightness(1)',
                    }}
                    >
                    {page}
                    </button>
                );
            })}
            <button
                onClick={() => setPaginaAtual(p => Math.min(p + 1, totalPaginas))}
                disabled={paginaAtual === totalPaginas}
                >
                Próximo →
            </button>
        </div>
        
        <br />
        <div className="totalDividas column">
            <strong>{search ? "pesquisa: " + search : ""}</strong>
            <strong>total em dividas: R${clientes.reduce((soma, cliente) => soma + cliente.totalDivida, 0)}</strong>
        </div>

        <Modal open={abriLixeira}>
                <div className="column">
                    <div className="row">
                        <label style={{backgroundColor: "white", padding: 4, borderRadius: 4}}>Pesquisa: </label>
                        <input type="search"
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            } />
                        <div className="row-end">
                            <button type="reset" onClick={() => setAbrirLixeira(false)}>fechar</button> 
                        </div>
                    </div>
                <table id="tabela-clientes">
                    <thead>
                        <tr>
                            <th>Id</th>
                            <th>Nome</th>
                            <th>Email</th>
                            <th>CPF</th>
                            <th>Idade</th>
                            <th>Total em divida</th>
                            <th>Data Cadastro</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            lixeiraAtual.map(cliente =>
                                <LinhaCliente key={cliente.id}
                                    cliente={cliente}
                                    onClick={() => selecionarLinha(cliente)}></LinhaCliente>
                            )
                        }
                    </tbody>
                </table>
                <div className="pagination">
                    <button
                        onClick={() => setPaginaAtualLixeira(p => Math.max(p - 1, 1))}
                        disabled={paginaAtualLixeira === 1}>
                        ← Anterior
                    </button>
                    {[...Array(paginasLixeira)].map((_, idx) => {
                        const page = idx + 1;
                        return (
                            <button
                            key={page}
                            onClick={() => setPaginaAtualLixeira(page)}
                            style={{
                                fontWeight: page === paginaAtualLixeira ? 'bold' : 'normal',
                                filter: page === paginaAtualLixeira ? 'brightness(0.5)' : 'brightness(1)',
                            }}
                            >
                            {page}
                            </button>
                        );
                    })}
                    <button
                        onClick={() => setPaginaAtualLixeira(p => Math.min(p + 1, paginasLixeira))}
                        disabled={paginaAtualLixeira === paginasLixeira}
                        >
                        Próximo →
                    </button>
                </div>
            </div>
        </Modal>

        <Modal open={open}>
            <form method="post" onSubmit={submitForm}>
                <div className="column">
                    <label>Nome:</label>
                    <input defaultValue={selected?.nome} required type="text" name="nome"/>
                    <label>Email:</label>
                    <input defaultValue={selected?.email} required type="text" name="email"/>
                    <label>CPF:</label>
                    <input
                        value={cpf}
                        onKeyDown={(e) => {
                            if (e.key.length == 1 && !e.key.match(/\d/)) {
                                e.preventDefault();
                            }
                        }}
                        onChange={(e) => setCpf(e.target.value)}
                        required type="text" name="cpf"/>
                    <label>Data de nascimento:</label>
                    <input defaultValue={selected?.dataNascimento.split("T")[0]} required name="data-nascimento" type="date"/>
                    <div className="row">
                        <button type="submit" onClick={() => {selected? setApagar(2) : setApagar(0)}}>Cadastrar</button>
                        <button type="reset" onClick={() => setOpen(false)}>Cancelar</button>
                    </div>
                </div>
                <div className="column">
                    <div className={`${selected?.ativo == false ? "" : "hidden"}`}>
                        <div className="row-end">
                            <button type="submit" onClick={() => {setApagar(0)}}>restaurar</button>
                        </div>
                    </div>
                    <div className={selected? "" : "hidden"}>
                        <div className="column">
                            <button className="apagar" onClick={() => {setApagar(1),
                                                                    clientesAtual.length == 1 ? setPaginaAtual(1) : "",
                                                                    lixeiraAtual.length == 1 ? setPaginaAtualLixeira(1) : ""}
                                                                }>apagar</button>
                        </div>
                    </div>
                </div>
            </form>
        </Modal>

        <div className={`${erros.length ? "" : "hidden"}`}>
            <div className="div-erro column">
                {erros.map(e => <strong className="error">{e.propriedade}: {e.mensagem}</strong>)}
            </div>
        </div>
    </div>
}

function LinhaCliente({ cliente, onClick }) {
    const data = new Date(cliente.dataCadastro);

    return (<tr onClick={onClick}>
        <td>{cliente.id}</td>
        <td>{cliente.nome}</td>
        <td>{cliente.email}</td>
        <td>{cliente.cpf}</td>
        <td>{cliente.idade}</td>
        <td>{cliente.totalDivida}</td>
        <td>{data.toLocaleString()}</td>
    </tr>)
}

function ClienteCard({ cliente, onClick }) {

    return <div onClick={onClick} class="card"
    >
        <h4>{cliente.nome}</h4>
        <ul>
            <li>
                <strong>ID:</strong> {cliente.id}
            </li>
            <li>
                <strong>Idade:</strong> {cliente.idade}
            </li>
            <li>
                <strong>Cpf:</strong> {cliente.cpf}
            </li>
            <li>
                <strong>E-mail:</strong> {cliente.email}
            </li>
            <li>
                <strong>Total em Divida:</strong> R${cliente.totalDivida}
            </li>
        </ul>
    </div>
}
