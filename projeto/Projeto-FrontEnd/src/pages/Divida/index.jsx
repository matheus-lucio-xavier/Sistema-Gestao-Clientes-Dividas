import { useEffect, useState, useMemo } from "react"
import { deleteDivida, getDividaById, listarDividas, salvarDivida } from "../../services/dividaService";
import { listarClientes} from "../../services/clienteService";
import Modal from "../../components/Modal";

const tamPagina = 10;

export default function DividaPage() {

    const [dividas, setDividas] = useState([]);

    const [clientes, setClientes] = useState([]);

    const [open, setOpen] = useState(false);

    const [selected, setSelected] = useState(null);

    const [cltid, setCltid] = useState(null)

    const [situacao, setSituacao] = useState("");

    const params = new URLSearchParams(window.location.search);

    const [erros, setErros] = useState([]);

    const [search, setSearch] = useState("");

    const [cliente, setCliente] = useState(0);

    const [paginaAtual, setPaginaAtual] = useState(1);

    const [apagar, setApagar] = useState(false)

    const dividasAtual = useMemo(() => {
        const primeiroIdx = (paginaAtual - 1) * tamPagina;
        const ultimoIdx = primeiroIdx + tamPagina;
        return dividas.slice(primeiroIdx, ultimoIdx);
    }, [paginaAtual, dividas]);

    const totalPaginas = Math.ceil(dividas.length / tamPagina);

    const fetchData = async () => {
        const resultado = await listarDividas(search, cliente);
        const resultado2 = await listarClientes("")
        if (resultado.status == 200) {
            setDividas(resultado.data);
        }
        if (resultado2.status == 200) {
            setClientes(resultado2.data);
        }
    }

    const submitForm = async (event) => {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);
        const situacao = formData.get("situacao")? true : false

        if (apagar) {
            if (selected) {
                const deleta = await deleteDivida(selected.id)
                if (deleta.status == 200){
                    fetchData();
                }else {
                    if (resultado.status == 422) {
                        setErros(resultado.data);
                    }
                }
            }
        }

        const divida = {
            valor: formData.get("valor"),
            clienteId: formData.get("cliente"),
            descricao: formData.get("descricao"),
            situacao: situacao,
            dataPagamento: formData.get("data-pagamento")
        };
        if (selected?.id) {
            divida.id = selected.id;
        }
        const resultado = await salvarDivida(divida);
        if (resultado.status == 200) {
            setOpen(false);
            fetchData();
        }else {
            if (resultado.status == 422) {
                setErros(resultado.data);
            }
            setErros(resultado.data);
        }

        form.reset();
        setApagar(false)
    }
    useEffect(() => {
        if (selected) {
            setSituacao(selected.situacao ? "true" : "");
            setCltid(selected.clienteId);
        }else {
            setSituacao("");
            setCltid(1)
        }
    }, [selected]);

    useEffect(() => {
        var timeout = setTimeout(() => {
            fetchData();
        }, 500);

        return () => {
            clearTimeout(timeout);
        }
    }, [search, cliente]);

    useEffect(() => {
        setPaginaAtual(1);
    }, [clientes]);

    useEffect(() => {
        var timeout = setTimeout(() => {
            setErros([]);
        }, 5000);

        return () => {
            clearTimeout(timeout);
        }
    }, [erros]);

    const selecionarLinha = async (divida) => {
        const resultado = await getDividaById(divida.id);
        if (resultado.status == 200) {
            setSelected(resultado.data);
            setOpen(true);
        }
    };

    return (<>
        <h1>Dividas</h1>

        <div className="filters">
            <label>Pesquisa:</label>
            <input name="pesquisa"
                type="search"
                value={search}
                onChange={(e) =>
                    setSearch(e.target.value)
                }
            />
            <label>Pesquisa por cliente:</label>
            <select name="cliente" value={cliente} onChange={(e) => setCliente(e.target.value)}>
                <option value="0">nenhum</option>
                {
                    clientes.map(clt =>
                        <option key={clt.id} value={clt.id}>{clt.nome} • {clt.cpf}</option>
                    )
                }
            </select>
            <button type="button" onClick={() => {
                setOpen(true);
                setSelected(null);
            }}>Nova Divida</button>
        </div>

        <table id="tabela-dividas">
            <thead>
                <tr>
                    <th>Id</th>
                    <th>Valor</th>
                    <th>Cliente</th>
                    <th>situação</th>
                    <th>Data Pagamento</th>
                    <th>Data Cadastro</th>
                </tr>
            </thead>
            <tbody>
                {
                    dividasAtual.map(divida =>
                        <LinhaDivida key={divida.id}
                            clientes={clientes}
                            divida={divida}
                            onClick={() => selecionarLinha(divida)}></LinhaDivida>
                    )
                }
            </tbody>
            {
                dividasAtual.length === 0 && (
                    <div className="empty-state">
                        Nenhuma dívida encontrada.
                    </div>
                )
            }
        </table>
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
            <strong>{search ? "pesquisa: " + search : ""} {search && cliente ? "|" : ""} {cliente != 0 ? "cliente: " + clientes.find(divida => divida.id == cliente).nome : ""}</strong>
            <strong>total em dividas: R${dividas.filter(divida => divida.situacao == false).reduce((soma, divida) => soma + divida.valor, 0)}</strong>
            <strong>total em dividas pagas: R${dividas.filter(divida => divida.situacao == true).reduce((soma, divida) => soma + divida.valor, 0)}</strong>
        </div>

        <Modal open={open}>
            <form method="post" onSubmit={submitForm}>
                <div className="column">
                    <label>Valor:</label>
                    <input defaultValue={selected?.valor} required type="number" name="valor"/>
                    <label>Cliente:</label>
                    <select value={cltid} onChange={(e) => setCltid(e.target.value)} required name="cliente">
                        {
                            clientes.map(clt =>
                                <option key={clt.id} value={clt.id}>{clt.nome}({clt.cpf})</option>
                            )
                        }
                    </select>
                    <label>Situação</label>
                    <select value={situacao} onChange={(e) => setSituacao(e.target.value)} name="situacao">
                        <option value="">Pendente</option>
                        <option value="true">Paga</option>
                    </select>
                    <label>Descrição:</label>
                    <textarea defaultValue={selected?.descricao} required name="descricao"></textarea>
                    <label>Data de pagamento:</label>
                    <input defaultValue={selected?.dataPagamento.split("T")[0]} required name="data-pagamento" type="date" />
                    <div className="row">
                        <button type="submit">Cadastrar</button>
                        <button type="reset" onClick={() => setOpen(false)}>Cancelar</button>
                    </div>
                </div>
                <div className={selected? "" : "hidden"}>
                    <div className="column">
                        <button className="apagar" onClick={() => {setApagar(true)}}>apagar</button>
                    </div>
                </div>
            </form>
        </Modal>
        <div className={`${erros.length ? "" : "hidden"}`}>
            <div className="div-erro column">
                {erros.map(e => <strong className="error">{e.propriedade}: {e.mensagem}</strong>)}
            </div>
        </div>
    </>)
}

function LinhaDivida({ clientes, divida, onClick }) {
    const data = new Date(divida.dataCadastro);
    const situacao = divida.situacao? "Paga" : "Pendente";
    const cliente = clientes.find(c => c.id === divida.clienteId);

    const nome = cliente?.nome?.trim()
        ? cliente.nome
        : "Cliente não encontrado";

    return (<tr onClick={onClick} className={divida.situacao? "linha-paga": new Date(divida.dataPagamento) < new Date()? "linha-atrasada" : ""}>
        <td>{divida.id}</td>
        <td>{divida.valor}</td>
        <td>{nome}</td>
        <td><span className={`badge ${divida.situacao ? "success" : "danger"}`}>{situacao}</span></td>
        <td>{new Date(divida.dataPagamento).toLocaleString()}</td>
        <td>{data.toLocaleString()}</td>
    </tr>)
}
