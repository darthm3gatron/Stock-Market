import React from 'react'
import {render} from 'react-dom'

import About from './About'
import Search from './Search'
import Chart from './Chart'

import './theme/style.scss'

const DEV_HOST = 'http://localhost:7000';
const PROD_HOST = 'https://blooming-ocean-10450.herokuapp.com';
const HOST = DEV_HOST;

const socket = io.connect(PROD_HOST);

class App extends React.Component {
    constructor() {
        super();
        this.state = {
            inputSymbol: '',
            stocks: [],
            loading: true,
            initialLoad: true,
            showInfo: false
        }
        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.handleInput = this.handleInput.bind(this);
        this.addStock = this.addStock.bind(this);
        this.removeStock = this.removeStock.bind(this);
        this.toggleInfo = this.toggleInfo.bind(this);
    }
    componentWillMount() {
        window.addEventListener('keypress', this.handleKeyPress);
        socket.emit('init');
        socket.on('inform-length', (num) => {
            if(num === 0) {
                this.setState({
                    initialLoad: true,
                    dataLength: -1
                })
            } else {
                this.setState({
                    dataLength: num
                });
            }
        });
        socket.on('init-stock', (data) => {
            const {stocks} = this.state;
            const updatedStocks = [...stocks, data];
            this.setState({
                stocks: updatedStocks
            });
            if(updatedStocks.length === this.state.dataLength || this.state.dataLength === 0) {
                this.setState({
                    loading: false,
                    initialLoad: false,
                    inputSymbol: ''
                });
            }
        });
    }
    componentDidMount() {
        socket.on('stock-added', (data) => {
            const {stocks} = this.state;
            const updatedStocks = [...stocks, data];
            this.setState({
                stocks: updatedStocks,
                loading: false
            });
        });
        socket.on('lookup-error', (message) => {
            alert(message);
            this.setState({loading: false});
        });
        socket.on('stock-removed', (symbol) => {
            const {stocks} = this.state;
            const updatedStocks = stocks.filter((stock) => {
                return stock.dataset.dataset_code !== symbol.toUpperCase();
            });
            this.setState({
                stocks: updatedStocks
            });
        });
    }
    handleKeyPress(e) {if(e.keyCode === 13){this.addStock()}}
    handleInput(e) {
        this.setState({inputSymbol: e.target.value});
    }
    addStock() {
        const {stocks, inputSymbol} = this.state;
        const ticker = inputSymbol.trim().toUpperCase();
        if (!this.state.initialLoad) {
            if(inputSymbol !== '') {
                function preventDuplicate(ticker) {
                    for (let i=0; i < stocks.length; i++) {
                        if (stocks[i].dataset.dataset_code === ticker) {
                            return true;
                        }
                    }
                    return false;
                }
                if(preventDuplicate(ticker)) {
                    alert('This stock is already listed!');
                    this.setState({inputSymbol: ''});
                } else {
                    socket.emit('add', ticker);
                    this.setState({
                        inputSymbol: '',
                        loading: true
                    });
                }
            }
        } else if (this.state.dataLength === 1) {
            socket.emit('add', ticker);
            this.setState({
                initialLoad: false,
                inputSymbol: '',
                loading: true
            });
        }
    }
    removeStock(ticker) {
        if (!this.state.initialLoad) {
            const {stocks} = this.state;
            const updatedStocks = stocks.filter((stock) => {
                return stock.dataset.dataset_code !== ticker.toUpperCase();
            });
            this.setState({
                stocks: updatedStocks
            });
            socket.emit('remove-stock', ticker);
        }
    }
    toggleInfo() {this.setState({showInfo: !this.state.showInfo})}
    render() {
        const renderStocks = this.state.stocks.map((stock, idx) => {
            return (
                <div key = {idx} className = 'stock' onClick = {this.removeStock.bind(this, stock.dataset.dataset_code, idx)}>
					<span className = 'stockTitle'>{stock.dataset.dataset_code}</span>
					<i className = "fa fa-trash" aria-hidden="true"></i>
				</div>
            );
        });
        const {stocks} = this.state;
        return (
            <div>
				{ this.state.showInfo && <About toggleInfo = {this.toggleInfo} /> }
				<div className = 'main'>
					
					<h1 className = 'title'>Chart the Stock Market</h1>

					<p className = 'info twitterLink'><a target = "_blank" href="https://twitter.com/bonham_000">@bonham000</a></p>
					<p className = 'info aboutLink'><a onClick = {this.toggleInfo}>About</a></p>

					<Search
						inputSymbol = {this.state.inputSymbol} 
						handleInput = {this.handleInput}
						addStock = {this.addStock} />

					{ this.state.loading && this.state.initialLoad && this.state.dataLength > 0 &&
						<p className = 'loadingMsg'>Please wait, currently loading {this.state.stocks.length + 1} of {this.state.dataLength} stocks</p> }
					
					{ this.state.loading && !this.state.initialLoad &&
						<p className = 'loadingMsg'>Please wait, the data is loading...</p> }

					<div className = 'flexWrapper'>
						<div>
							<div className = 'stocksComponent'>
								{renderStocks}
							</div>
						</div>
						<Chart className = 'chartComponent' stockData = {stocks} initStatus = {this.state.initialLoad} />
					</div>

				</div>
			</div>
        );
    }
};

render(<App />, document.getElementById('app-root'));