# Interfaces do Jogo Asteroids

Esta pasta contém todas as interfaces do jogo organizadas por tipo de arquivo.

## Estrutura Organizada

```
interfaces/
├── html/                    # Arquivos HTML das interfaces
│   ├── start_screen.html    # Estrutura da tela inicial
│   └── game_over.html       # Estrutura da tela de game over
├── css/                     # Arquivos CSS das interfaces  
│   ├── start_screen.css     # Estilos da tela inicial
│   └── game_over.css        # Estilos da tela de game over
├── js/                      # Arquivos JavaScript das interfaces
│   ├── start_screen.js      # Lógica da tela inicial
│   └── game_over.js         # Lógica da tela de game over
└── README.md               # Esta documentação
```

## Vantagens desta Estrutura

- ✅ **Separação por tipo**: HTML, CSS e JS em pastas dedicadas
- ✅ **Fácil manutenção**: Cada interface tem seus arquivos separados
- ✅ **Escalabilidade**: Fácil adicionar novas interfaces (pause, configurações, etc.)
- ✅ **Organização**: Designer trabalha no HTML/CSS, programador no JS
- ✅ **Reutilização**: CSS pode ser compartilhado entre interfaces

## Como usar

Cada interface é um módulo independente que carrega seus próprios arquivos:

### StartScreenHUD
- `StartScreenHUD.show()` - Exibe a tela inicial
- `StartScreenHUD.hide()` - Oculta a tela inicial

### GameOverHUD  
- `GameOverHUD.show()` - Exibe a tela de game over
- `GameOverHUD.hide()` - Oculta a tela de game over

## Integração

As interfaces se comunicam com o GameFunctions através das funções:
- `GameFunctions.start()` - Inicia o jogo
- `GameFunctions.restart()` - Reinicia o jogo
- `GameFunctions.score` - Acessa a pontuação atual

## Adicionando Novas Interfaces

Para adicionar uma nova interface (ex: pause):

1. Criar `html/pause.html` com a estrutura
2. Criar `css/pause.css` com os estilos  
3. Criar `js/pause.js` com a lógica
4. Adicionar script no `index.html`