pragma solidity ^0.4.17;

contract mortal {
    /* Define variable owner of the type address */
    address owner;
    
    /* This function is executed at initialization and sets the owner of the contract */
    function mortal() public { owner = msg.sender; }

    /* Function to recover the funds on the contract */
    function kill() public { if (msg.sender == owner) selfdestruct(owner); }
}


contract tradingEmissions is mortal {

  address creator;
  
  address regulator;
  // STATE 
  struct Company{
    //uint RIN_ID;?
    string name;
    int emus;//emu => emission units, emu <= emuLimit at all times, less is better
    uint emuLimit; //upper bound, more is not possible => implies a fine to compayn
    uint emusOnSale; //more is better
    uint fine; // if >0 then it is locked
    uint fine_deadline;
  }

  address[] public market;
  
  uint emusPrice = 1; //1 wei == 1 emissionsunitPrice
  mapping (address => Company) companies;
  /* Constructor */
  function tradingEmissions() public {
    creator = msg.sender;
    addCompany(msg.sender, "testcompany", 500);
  }
  
  modifier isCompany(address ad){
    require(bytes(companies[ad].name).length != 0);//name is the ID atm
    _;
  }
    
  modifier enoughFreeUnits(address seller, uint emus, uint price){
    uint totalUnits=0;
    require(emus==emusPrice*price);
    require(companies[seller].emusOnSale>= emus);
    _;
  }
  
  function buyEmusFromMarket(uint emus) public payable {
    for(uint i = 0; i < market.length; i++) {
      if(emus <= 0) { // if all emus is bought we return
        return;
      }
      emus -= buyEmus(msg.sender, market[i], emus, msg.value); // buy and decrease emus
    }

  }

  function removeCompanyFromMarket(address company) public payable {
    for(uint i = 0; i < market.length; i++) {
      if(market[i] == company) {
        delete market[i];
    //    delete companies[company];
      }
    }
  }
  
  function buyEmus(address buyerAd, address sellerAd, uint emus, uint value) 
    isCompany(sellerAd)
    isCompany(buyerAd) // msg.sender = buyer
    enoughFreeUnits(sellerAd, emus, value) // msg.value
    returns (uint)
  {
    Company seller = companies[sellerAd];
    Company buyer = companies[buyerAd]; // TODO: check if gets reference or value

	  seller.emusOnSale -= emus;
	  buyer.emus -= int(emus); // emus get decreased when buying
	
	  sellerAd.send(value);//TO-TEST send money to seller

    if (seller.emusOnSale == 0) {
      removeCompanyFromMarket(sellerAd); 
    }
    return emus;
  }
  
  modifier enoughForSale(address owner, uint emusToSale){
    require(companies[owner].emuLimit>=companies[owner].emusOnSale+emusToSale);
    _;
  }
  
  function putEmusOnSale(uint emusToSale)
    enoughForSale(msg.sender,emusToSale)
  {
    companies[msg.sender].emusOnSale+=emusToSale;
    companies[msg.sender].emus+=int(emusToSale);
  }

  modifier enoughToRemove(address owner, uint emusToRemove){
    require(companies[owner].emusOnSale>=emusToRemove);
    _;
  }

  function removeEmusFromSale(uint emusToRemove)
    enoughToRemove(msg.sender,emusToRemove)
  {
    companies[msg.sender].emusOnSale-=emusToRemove;
    companies[msg.sender].emus-=int(emusToRemove);
  }

  modifier isRegulator(address ad){
    require(regulator==ad);
    _;
  }
  
  function updateEmus(address company, uint addedEmus)
    isCompany(company)
    isRegulator(msg.sender)
  {
    companies[company].emus+=int(addedEmus);
    if(companies[company].emus>int(companies[company].emuLimit))// --> Account uncovered
      timestamp(company);
  }

  function timestamp(address company){
    companies[company].fine_deadline = block.timestamp + 86400*15;//15 days for deadline to balance account
  }

  modifier isUncovered(address company){
    require(companies[company].emus>int(companies[company].emuLimit));
    _;
  }
  
  function putFine(address company, uint fine)
    isRegulator(msg.sender)
    isCompany(company)
    isUncovered(company)
  {
    //lock account
    companies[company].fine = fine;//account locked till fine paid
  }

  modifier isLocked(address company){
    require(companies[company].fine>0);
    _;
  }
  
  function payFine() payable
    isLocked(msg.sender)
  {
    require(msg.value==companies[msg.sender].fine);
    companies[msg.sender].fine=0;
    regulator.send(msg.value);//TO-TEST send money to regulator
  }

  modifier isCreator(address ad){
    require(ad==owner);
    _;
  }
  
  modifier isNotCompany(address ad){
    require(bytes(companies[ad].name).length == 0);//name is the ID atm
    _;
  }
  
  function addCompany(address company, string name, uint emuLimit)
    isCreator(msg.sender)
    isNotCompany(company) {
    companies[company].name=name;
    companies[company].emuLimit=emuLimit;
    market.push(company); // add company to market
  }

  function addRegulator(address newRegulator)
    isCreator(msg.sender)
    isNotCompany(newRegulator){
    regulator = newRegulator;
  }

  // Getters
  
  function getName() view public returns (string) {
    return companies[msg.sender].name;
  }
  
    
  function getCompanyName(address adr) view public returns (string) {
    return companies[adr].name;
  }


  function getEmus() view public returns (int) {
    return companies[msg.sender].emus;
  }
    
  function getEmuLimit() view public returns (uint) {
    return companies[msg.sender].emuLimit;
  }

  function getEmusOnSale() view public returns (uint) {
    return companies[msg.sender].emusOnSale;
  }

  function getFine() view public returns (string) {
    return bytes32ToString(uintToBytes(companies[msg.sender].fine));
  }  

  function bytes32ToString(bytes32 x) constant returns (string) {
      bytes memory bytesString = new bytes(32);
      uint charCount = 0;
      for (uint j = 0; j < 32; j++) {
          byte char = byte(bytes32(uint(x) * 2 ** (8 * j)));
          if (char != 0) {
              bytesString[charCount] = char;
              charCount++;
          }
      }
      bytes memory bytesStringTrimmed = new bytes(charCount);
      for (j = 0; j < charCount; j++) {
          bytesStringTrimmed[j] = bytesString[j];
      }
      return string(bytesStringTrimmed);
  }

  function uintToBytes(uint v) constant returns (bytes32 ret) {
    if (v == 0) {
        ret = '0';
    }
    else {
        while (v > 0) {
            ret = bytes32(uint(ret) / (2 ** 8));
            ret |= bytes32(((v % 10) + 48) * 2 ** (8 * 31));
            v /= 10;
        }
    }
    return ret;
}
}
