
const game = (() => {
    const UI = (() => {
        const popupElement = document.querySelector('.popup');
        const playerScoreElement = document.querySelector('.score1')
        const botScoreElement = document.querySelector('.score2')
        const boardElement = document.querySelector('.board')
        const userScoreParentElement = document.querySelector('.userScore')
        const botScoreParentElement = document.querySelector('.botScore')
        const roundCountElement = document.querySelector('.roundCount')
        const winnerAnnouncementElement = document.querySelector('.winnerAnnouncement')
        return {
            popupElement, 
            playerScoreElement, 
            botScoreElement, 
            boardElement, 
            userScoreParentElement, 
            botScoreParentElement, 
            roundCountElement, 
            winnerAnnouncementElement
        }
    })()

    const state = (() => {
        let playerScore;
        let botScore;
        let turn;
        let round;
        const gameBoard = [
            [-1, -1, -1],
            [-1, -1, -1],
            [-1, -1, -1]
        ];

        const handlers = new Map();

        return {
            playerScore,
            botScore,
            turn,
            round,
            gameBoard,
            handlers
        }
    })()

    

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));


    const initEventHandlers = () => {
        const arr = Array.from(UI.boardElement.children);
        arr.forEach(card => {
            const row = card.getAttribute('row');
            const col = card.getAttribute('col');
    
            const handler = () => userClick(row, col);
            state.handlers.set(card, handler); // store the function
            card.addEventListener('click', handler);
        });
    }

    const removeEventHandlers = () => {
        const arr = Array.from(UI.boardElement.children);
        arr.forEach(card => {
            const handler = handlers.get(card); // retrieve stored function
            if (handler) {
                card.removeEventListener('click', handler);
                state.handlers.delete(card); // clean up after removing
            }
        });
    }

    const toggleCards = (cards) => {
        cards.forEach(([i, j]) => {
            const card = UI.boardElement.querySelector(`[row='${i}'][col='${j}']`)
            card.style.backgroundColor = "green";
            setTimeout(() => {
                card.style.backgroundColor = "var(--bg-secondary-color)"
            }, 1000);
        })
    };

    const userTurn = async (row, col) => {
        if (state.turn !== 'user')
            return;

        if (state.gameBoard[row][col] !== -1)
            return;

        state.gameBoard[row][col] = 'X';
        render();
        const roundOver = await handleWinner()
        if (roundOver)
            return;

        state.turn = 'bot'
        render();
        setTimeout(() => {
            botTurn();

        }, 1250)
    }

    const botTurn = async () => {
        state.turn = 'bot';
        const [computerRow, computerColumn] = getComputerInput();
        state.gameBoard[computerRow][computerColumn] = 'O';
        render();

        const roundOver = await handleWinner()
        if (roundOver)
            return;

        state.turn = 'user'
        render();
    }


    const updateScores = (winner) => {
        if (winner === 'X') state.playerScore++;
        else if (winner === 'O') state.botScore++;
    }

    const isMatchOver = () => {
        return state.botScore >= 3 || state.playerScore >= 3
    }

    const resetBoard = () => {
        state.gameBoard.forEach(row => {
            row.fill(-1, 0, 3)
        });
    }


    const handleWinner = async () => {
        const [status, winner, winnerCards] = checkWinner();
        if (!status) return false;


        toggleCards(winnerCards);
        updateScores(winner)

        if (isMatchOver()) {
            removeEventHandlers()
            announceWinner(winner);
            showPopup();
            return true;
        }

        state.round++;
        
        await sleep(1000)
        resetBoard();
        return false;
    }


    const userClick = (row, col) => {
        userTurn(row, col);
    }

    const resetState = () => {
        state.botScore = 0;
        state.playerScore = 0;
        state.round = 1;
        state.turn = 'user';
        resetBoard();
    }


    const init = () => {
        hidePopup();
        resetState();
        initEventHandlers();
    }


    const render = () => {
        const gameBoard1d = state.gameBoard.flat();
        gameBoard1d.forEach((val, index) => {
            UI.boardElement.children.item(index).innerHTML = val === -1 ? "" : val;
        });
        UI.userScoreParentElement.style.backgroundColor = state.turn === 'user' ? 'var(--active)' : 'var(--inactive)';
        UI.userScoreParentElement.style.color = state.turn === 'user' ? 'var(--bg-primary-color)' : 'white';

        UI.botScoreParentElement.style.backgroundColor = state.turn === 'bot' ? 'var(--active)' : 'var(--inactive)';
        UI.botScoreParentElement.style.color = state.turn === 'bot' ? 'var(--bg-primary-color)' : 'white';
        UI.playerScoreElement.innerHTML = state.playerScore;
        UI.botScoreElement.innerHTML = state.botScore;
        UI.roundCountElement.innerHTML = state.round

    }
    const getAvailablePositions = () => {
        const positions = [];
        state.gameBoard.forEach((row, rowIndex) => {
            row.forEach((colVal, colIndex) => {
                colVal === -1 ? positions.push([rowIndex, colIndex]) : null;
            })
        })
        return positions;
    };

    const getComputerInput = () => {
        const availablePositions = getAvailablePositions();
        const count = availablePositions.length;
        const randomIndex = parseInt(Math.random() * count)
        const row = availablePositions[randomIndex][0];
        const column = availablePositions[randomIndex][1];
        return [row, column]
    };



    const checkWinner = () => {
        const row1 = state.gameBoard[0]
        const row2 = state.gameBoard[1]
        const row3 = state.gameBoard[2]
        for (let i = 0; i < state.gameBoard.length; i++) {
            if (row1[i] === row2[i] &&
                row2[i] === row3[i] &&
                row1[i] !== -1) { // not default value
                return [true, row1[i], [[0, i], [1, i], [2, i]]]
            }
        }

        // check rows
        for (let i = 0; i < state.gameBoard.length; i++) {
            const rowSame = state.gameBoard[i].every(val => val === state.gameBoard[i][0] && val !== -1);
            if (rowSame) {
                return [true, state.gameBoard[i][0], [[i, 0], [i, 1], [i, 2]]]
            }
        }

        // check corners
        const topLeftCorner = state.gameBoard[0][0];
        const bottomLeftCorner = state.gameBoard[2][0];
        const topRightCorner = state.gameBoard[0][2];
        const bottomRightCorner = state.gameBoard[2][2];
        const middle = state.gameBoard[1][1];

        const leftToRight = topLeftCorner === middle && middle === bottomRightCorner;
        const rightToLeft = bottomLeftCorner === middle && middle === topRightCorner;

        if (leftToRight && middle !== -1) {
            return [true, middle, [[0, 0], [1, 1], [2, 2]]];
        }
        if (rightToLeft && middle !== -1) {
            return [true, middle, [[2, 0], [1, 1], [0, 2]]]
        }

        // check if all positions are filled
        const availablePositions = state.gameBoard.flat().filter(val => val === -1).length;
        if (availablePositions === 0) // it's a draw
            return [true, null, []]

        return [false, null, []];

    };


    const hidePopup = () => {
        UI.popupElement.style.opacity = 0;
        setTimeout(() => {
            UI.popupElement.style.display = 'none'
        }, 300);
    }

    const showPopup = () => {
        UI.popupElement.style.opacity = 1;
        setTimeout(() => {
            UI.popupElement.style.display = 'grid'
        }, 300);
    }

    const announceWinner = (winner) => {
        const winnerDisplay = winner === 'X' ? "Player" : "Bot"
        UI.winnerAnnouncementElement.innerHTML = `${winnerDisplay} has won!`;
        UI.popupElement.style.gap = '2rem';
    }
    const start = () => {
        init();
        render();
    }
    return { start }
})()

