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
  
  uint emusPrice = 1; //1 wei == 1 emissionsunitPrice
  mapping (address => Company) companies;
  /* Constructor */
  function tradingEmissions() public {
    creator = msg.sender;
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
  
  function buyEmus(address seller, uint emus) public payable // TODO QUEUE for buying instead of specifying seller
    isCompany(seller)
    isCompany(msg.sender)
    enoughFreeUnits(seller,emus,msg.value)
      {
	companies[seller].emusOnSale-= emus;
	companies[msg.sender].emus-= int(emus);
	

	seller.send(msg.value);//TO-TEST send money to seller
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
    isNotCompany(company){
    companies[company].name=name;
    companies[company].emuLimit=emuLimit;
  }

  function addRegulator(address newRegulator)
    isCreator(msg.sender)
    isNotCompany(newRegulator){
    regulator = newRegulator;
  }

  // Getters
  
  function getName() isCompany(msg.sender)
  view public returns (string)
  {
    return companies[msg.sender].name;
  }

  function getEmus() isCompany(msg.sender) view public returns (int)   
  {
    return companies[msg.sender].emus;
  }
    
  function getEmuLimit()  isCompany(msg.sender) view public returns (uint)   
  {
    return companies[msg.sender].emuLimit;
  }

  function getEmusOnSale() isCompany(msg.sender) view public returns (uint)    
  {
    return companies[msg.sender].emusOnSale;
  }

  function getFine()  isCompany(msg.sender) view public returns (uint)   
  {
    return companies[msg.sender].fine;
  }
  
}
