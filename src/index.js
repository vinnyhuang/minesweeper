import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import PropTypes from 'prop-types';

class Square extends React.Component {
  propTypes: {
    value: PropTypes.string,
    handleClick: PropTypes.func
  }

  render() {
    return (
      <button className="square" onClick={this.props.handleClick}>
        {this.props.value}
      </button>
    );
  }
}

// const Square = ({
//   value,
//   handleClick
// }) => (
//   <button className="square" onClick={ handleClick }>
//     { value }
//   </button>
// );



class Board extends React.Component {
  renderSquare(i, k) {
    return <Square value={i} key={k} handleClick={() => this.props.handleClick(k)}/>
  }

  render() {
    const fullBoard = [];
    const { rows, cols, display } = this.props;
    for (let i = 0; i < rows; i++) {
      var boardRow = [];
      for (var j = 0; j < cols; j++) {
        var index = cols * i + j;
        boardRow.push(this.renderSquare(display[index], index));
      }
      fullBoard.push(
        <div key={i} className="board-row">
          {boardRow}
        </div>
      );
    }

    return (
      <div>{fullBoard}</div>
    );
  }
}

class DimensionInput extends React.Component {
  constructor() {
    super();
    this.state = {
      rowInput: 10,
      colInput: 10,
      mineInput: 10
    }
    this.handleRowChange = this.handleRowChange.bind(this);
    this.handleColChange = this.handleColChange.bind(this);
    this.handleMineChange = this.handleMineChange.bind(this);
    this.submit = this.submit.bind(this);  // This is required ???
  }

  handleRowChange(event) {
    this.setState({rowInput: event.target.value});
  }

  handleColChange(event) {
    this.setState({colInput: event.target.value});
  }

  handleMineChange(event) {
    this.setState({mineInput: event.target.value});
  }

  submit(event) {
    event.preventDefault();
    this.props.handleSubmit(parseInt(this.state.rowInput, 10),
                            parseInt(this.state.colInput, 10),
                            parseInt(this.state.mineInput, 10));
  }

  render() {
    return (
      <div>
        <form onSubmit={this.submit}>
          <label>
            # Rows:
            <input type="number" value={this.state.rowInput} onChange={this.handleRowChange} />
          </label>
          <label>
            # Columns:
            <input type="number" value={this.state.colInput} onChange={this.handleColChange} />
          </label>
          <label>
            # Mines:
            <input type="number" value={this.state.mineInput} onChange={this.handleMineChange} />
          </label>
          <input type="submit" value="New Game" />
        </form>
      </div>
    )
  }
}

function updateDisplay(x, newFlips, tempDisplay, checked, state) {
  const { grid, rows, cols } = state;
  checked.push(x);
  var row = Math.floor(x / cols);
  var col = x % cols;
  if (grid[x].adjacent === 0) {
    for (var j = -1; j <= 1; j++) {
      for (var k = -1; k <= 1; k++) {
        if (row + j >= 0 && row + j < rows && col + k >= 0 && col + k < cols) {
          const adjx = x + cols * j + k;
          if (tempDisplay[adjx] === '?') {
            tempDisplay[adjx] = grid[adjx].adjacent ? grid[adjx].adjacent.toString() : ' ';
            newFlips++;
          }
          if ((j === 0 || k === 0) && j !== k &&
              grid[adjx].adjacent === 0 && checked.indexOf(adjx) === -1) {
            const result = updateDisplay(adjx, newFlips, tempDisplay, checked, state);
            newFlips = result.newFlips;
            tempDisplay = result.tempDisplay;
            checked = result.checked;
          }
        }
      } 
    }
  } else {
    tempDisplay[x] = grid[x].adjacent.toString();
    newFlips++;
  }
  // }
  return { newFlips, tempDisplay, checked };
}

class Game extends React.Component {
  constructor() {
    super();
    this.state = {
      rows: 0,
      cols: 0,
      mines: 0,
      flips: 0,
      gameOver: false,
      gameWon: false,
      grid: [],
      display: []
    }

    this.newGrid = this.newGrid.bind(this);
    this.newDisplay = this.newDisplay.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleClick = this.handleClick.bind(this);
    // this.updateDisplay = this.updateDisplay.bind(this);
  }

  newGrid(r, c, m) {
    const grid = Array(r * c).fill({}).map(() => ({ mine: false, adjacent: 0 }));
    var randomSquares = [];
    while (m > 0) {
      var randomSquare = Math.floor(Math.random() * r * c);
      if (grid[randomSquare].mine === false) {
        grid[randomSquare].mine = true;
        randomSquares.push(randomSquare);
        m--;
      }
    }
    for (var i = 0; i < r * c; i++) {
      var row = Math.floor(i / c);
      var col = i % c;
      var adj = 0;
      for (var j = -1; j <= 1; j++) {
        for (var k = -1; k <= 1; k++) {
          if (!(j === 0 && k === 0) &&
              row + j >= 0 && row + j < r && col + k >= 0 && col + k < c &&
              grid[i + c * j + k].mine) {
            adj++;
          }
        }
        grid[i].adjacent = adj;
      }
    }

    return grid;
  }

  newDisplay(r, c) {
    return Array(r * c).fill('?');
  }

  handleSubmit(r, c, m) {
    const rows = r > 0 ? r : 10;
    const cols = c > 0 ? c : 10;
    const mines = m > 0 ? m : 10;

    this.setState({
      rows,
      cols,
      mines,
      flips: 0,
      gameOver: false,
      gameWon: false,
      grid: this.newGrid(rows, cols, mines),
      display: this.newDisplay(rows, cols)
    }, () => console.log('state', this.state));
  }

  handleClick(i) {
    const { gameOver, display, grid, rows, cols, flips, mines } = this.state;

    if (gameOver || display[i] !== "?") {
      return;
    } else if (grid[i].mine === true) {
      this.setState({
        gameOver: true,
        display: display.map((x, j) => (grid[j].mine ? 'X' : x))
      });
    } else {
      const { newFlips, tempDisplay } = updateDisplay(i, 0, display.slice(), [], this.state);
      var totalFlips = flips + newFlips;
      var gameWon = totalFlips + mines === rows * cols ? true : false
      console.log(totalFlips, gameWon);
      this.setState({
        display: tempDisplay,
        flips: totalFlips,
        gameOver: gameWon,
        gameWon: gameWon
      });
    }
  }

  render() {
    return (
      <div className="game">
        <DimensionInput handleSubmit={this.handleSubmit}/>
        <div className="game-board">
          <Board rows={this.state.rows} cols={this.state.cols} display={this.state.display} handleClick={this.handleClick}/>
        </div>
        <div className="game-info">
          <div>{this.state.gameWon ? 'You Win!' : ''}</div>
        </div>
      </div>
    );
  }
}

// ========================================

ReactDOM.render(
  <Game />,
  document.getElementById('root')
);


// import React from 'react';
// import ReactDOM from 'react-dom';
// import App from './App';
// import registerServiceWorker from './registerServiceWorker';
// import './index.css';

// ReactDOM.render(<App />, document.getElementById('root'));
// registerServiceWorker();
