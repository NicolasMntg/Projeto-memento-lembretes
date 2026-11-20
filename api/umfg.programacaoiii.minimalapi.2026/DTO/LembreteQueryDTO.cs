using umfg.programacaoiii.minimalapi._2026.Entidades;

namespace umfg.programacaoiii.minimalapi._2026.DTO;

public sealed class LembreteQueryDTO
{
    public sealed class LembreteQueryRequestDTO
    {
        /// <summary>
        /// Padrão uma página
        /// </summary>        
        public int NumeroPagina { get; set; } = 1;

        /// <summary>
        /// Padrão dez registros por página
        /// </summary>        
        public int TamanhoPagina { get; set; } = 10;

        /// <summary>
        /// Campo para ordenação dos registros retornados (Descricao, DataCadastro, DataAtualizacao). Padrão DataCadastro.
        /// </summary>        
        public string? Ordem { get; set; }

        /// <summary>
        /// Direção (DESC - ASC) da ordenação dos registros retornados. Padrão DESC.
        /// </summary>        
        public string? Direcao { get; set; }

        //filtros opcionais: tipos anuláveis para que o [AsParameters] não os trate como obrigatórios
        public string? Descricao { get; set; }

        public DateTime? DataCadastroInicial { get; set; }

        public DateTime? DataCadastroFinal { get; set; }

        public DateTime? DataAtualizacaoInicial { get; set; }

        public DateTime? DataAtualizacaoFinal { get; set; }
    }

    public sealed class LembreteQueryResponseDTO
    {
        public ICollection<Lembrete> Lembretes { get; set; } = [];

        public long Total { get; set; } = 0;

        public int NumeroPagina { get; set; } = 0;

        public int TamanhoPagina { get; set; } = 0;
    }
}
