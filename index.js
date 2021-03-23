const axios = require("axios");
//const fetch = require("fetch");
class ExchangeFunctions {

    constructor() {
        this.apiUrl = "https://api.wazniya.com:8443/cx";
        // this.apiVersion = "v3";
        // this.currencyToExchange = "wazn2btc";
        this.offer = {};
        this.offer_type = "";
        this.order = {};
        this.orderRefreshTimer = {};
        this.currentRates = {};
        this.orderStatus = {};
        this.exchangeConfiguration = {};
        //this.fetch = fetch;
    }

    initialiseExchangeConfiguration() {
        let self = this;
        // When the new endpoint goes live, we'll uncomment the flow below
        return new Promise((resolve, reject) => {
             let endpoint = `${self.apiUrl}/get_exchange_configuration`;
             axios.get(endpoint)
                .then((response) => {
                    self.exchangeConfiguration = response;
                    resolve(response);
                }).catch((error) => {
                    console.log("Unable to retrieve exchange configuration -- assume defaults");
                    let data = {
                        "referrer_info": {
                            "indacoin": {
                                "referrer_id": "WAZN12314",
                                "enabled": false
                            },
                            "localwazn": {
                                "referrer_id": "WAZN12314",
                                "enabled": false
                            }
                        },
                        "btc": {
                            "changenow": {
                                "exchange_workflow": "prepopulates_limits"
                            },
                            "waznto": {
                                "exchange_workflow": "prepopulate_limits",
                            },
                            "coinswitch": {
                                "exchange_workflow": "returns_limits_on_offer"
                            }
                        },
                        "eth": {
                            "changenow": {
                                "exchange_workflow": "prepopulates_limits",
                            },
                            "coinswitch": {
                                "exchange_workflow": "returns_limits_on_offer"
                            }
                        },
                }
                resolve(data);
                    reject(error);
                })


            // For now, here's our dummy data

        });
    }

    getOfferWithOutAmount(in_currency, out_currency, out_amount) {
        let data = {
            in_currency,
            out_currency,
            out_amount
        }

        const self = this;
        self.offer_type = "out_amount";
        let endpoint = `${self.apiUrl}/get_offer`;
        return new Promise((resolve, reject) => {
            axios.post(endpoint, data)
                .then(function (response) {
                    console.log('outAmount', response);
                    self.offer = response.data;
                    self.offer.out_amount = out_amount;
                    resolve(self.offer);
                })
                .catch(function (error) {
                    console.log(error);
                    reject(error);
                });
        });
    }

    getOfferWithInAmount(in_currency, out_currency, in_amount) {
        let data = {
            in_amount,
            in_currency,
            out_currency
        }

        const self = this;
        self.offer_type = "in_amount";
        let endpoint = `${self.apiUrl}/get_offer`;
        return new Promise((resolve, reject) => {
            axios.post(endpoint, data)
                .then(function (response) {
                    console.log('resp from getOfferwithtinamount', response);
                    self.offer = response.data;
                    resolve(self.offer);
                })
                .catch(function (error) {
                    console.log(error);
                    reject(error);
                });
        });
    }



    getOrderStatus() {
        const self = this;

        let endpoint = `${self.apiUrl}/order_status`;
        return new Promise((resolve, reject) => {
            let data = {
                "order_id": self.order.data.order_id
            }
            axios.post(endpoint, data)
                .then(function (response) {
                    self.orderStatus = response.data;
                    resolve(self.orderStatus);
                })
                .catch(function (error) {
                    console.log(error);
                    reject(error);
                });
        });
    }

    getOrderExpiry() {
        return this.orderStatus.expires_at;
    }

    getTimeRemaining() {
        return this.orderStatus.seconds_till_timeout;
    }

    createOrder(out_address, refund_address) {

        let self = this;
        let endpoint = `${self.apiUrl}/create_order`;
        let data = {
            out_address,
            refund_address,
            in_currency: "WAZN",
            out_currency: "BTC",
            ...self.offer
        }

        delete data.expires_at;
        if (self.offer_type == "out_amount") {
            delete data.in_amount;
        } else if (self.offer_type == "in_amount") {
            delete data.out_amount;
        }
        console.log(data);
        return new Promise((resolve, reject) => {
            try {
                axios.post(endpoint, data)
                    .then(function (response) {
                        self.order = response;
                        resolve(response);
                    })
                    .catch(function (error) {
                        reject(error);
                    });
            } catch (error) {
                reject(error);
            }
        });
    }


    getRatesAndLimits(in_currency, out_currency) {
        let self = this;
        return new Promise((resolve, reject) => {
            let data = {
                "in_currency": "WAZN",
                "out_currency": "BTC"
            }
            let endpoint = `${self.apiUrl}/get_info`;
            axios.post(endpoint, data)
                .then((response) => {
                    self.currentRates = response.data;
                    self.in_currency = "WAZN";
                    self.out_currency = "BTC";
                    self.currentRates.minimum_wazn = self.currentRates.in_min;
                    self.currentRates.maximum_wazn = self.currentRates.in_max;
                    resolve(response);
                }).catch((error) => {
                    reject(error);
                })
        });
    }

}

module.exports = ExchangeFunctions;
