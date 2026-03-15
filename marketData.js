let price = 5170;

function getMarketPrice() {

  const move = (Math.random() - 0.5) * 2;

  price = price + move;

  return parseFloat(price.toFixed(2));
}

function getSupport(price){

  return (price - 0.40).toFixed(2);

}

function getResistance(price){

  return (price + 0.40).toFixed(2);

}

function getSession(){

  const hour = new Date().getUTCHours();

  if(hour >= 0 && hour < 7){
    return "Asian";
  }

  if(hour >= 7 && hour < 13){
    return "London";
  }

  return "New York";

}

module.exports = {
  getMarketPrice,
  getSupport,
  getResistance,
  getSession
};
