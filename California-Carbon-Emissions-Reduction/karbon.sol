pragma solidity ^0.4.17;

contract mortal {
    /* Define variable owner of the type address */
    address owner;
    
    /* This function is executed at initialization and sets the owner of the contract */
    function mortal() public { owner = msg.sender; }

    /* Function to recover the funds on the contract */
    function kill() public { if (msg.sender == owner) selfdestruct(owner); }
}


contract karbon is mortal {

  address creator;
  // STATE 
  struct RIN{
    //uint RIN_ID;?
    uint credit;
    //expiration data...;
    uint256 expirationTime;
    address owner;
    address approved;
  }
  
  mapping (address => bool) renewableCompanies;
  mapping (address => bool) obligatedParties;
  mapping (address => bool) auditors; 
  mapping (uint => RIN) RINs; //matches RIN_IDs to RIN struct
  /* Constructor */
  function karbon() public {
    creator = msg.sender;
  }
  
  modifier isRenewableCompany(address ad){
    require(renewableCompanies[ad]);
    _;
  }

  
  function addRIN(uint credit,uint rinId, uint256 expiration) isRenewableCompany(msg.sender)
   public{
    require(RINs[rinId].owner==0);//does not already exist
    RIN rin;
    rin.credit = credit;
    rin.owner = msg.sender;
    rin.expirationTime = expiration; //in unix, set a way of controlling not expired TODO 
    RINs[rinId] = rin;
    RINs[rinId].credit = credit;
    RINs[rinId].owner = msg.sender;
  }

  modifier isObligatedParty(address ad){
    require(obligatedParties[ad]);
    _;
  }

  modifier isCompany(address ad){
    require(obligatedParties[ad] || renewableCompanies[ad]);
    _;
  }

  modifier isOwner(address owner, uint rin){
    require(RINs[rin].owner == owner);
    _;
  }

  modifier enoughMoney(uint value, uint rin){
    require(RINs[rin].credit == value);
    _;
  }
			       
  function buyRin(uint rin, address company) public payable
    isCompany(msg.sender)
    isOwner(company, rin)
    enoughMoney(msg.value, rin)
    isAudited(rin)//we require an auditor to approve this rin before selling it
  {
    RINs[rin].onwer.send(msg.value);
    RINs[rin].owner = msg.sender;
    
  }

  modifier isNotYetAssigned(address ad){
    !renewableCompanies[ad] && !obligatedParties[ad];
    _;
  }    
  function addRenewableCompany(address newCompany) public
    isNotYetAssigned(newCompany){
    require(creator==msg.sender);
    renewableCompanies[newCompany]=true;
  }

  function addObligatedParty(address newParty ) public
    isNotYetAssigned(newParty){
    require(creator==msg.sender);
    require(!renewableCompanies[newParty] && !obligatedParties[newParty]);
    obligatedParties[newParty]=true;
  }

  modifier isAuditor(address ad){
    require(auditors[ad]);
    _;
  }

  modifier rinExists(uint rin){
    require(RINs[rin].credit!=0);
    require(RINs[rin].expirationTime<=now);
    _;
  }

  modifier isNotAudited(uint rin){
    require(RINs[rin].approved!=0);
    _;
  }

  modifier isAudited(uint rin){
    require(RINs[rin].approved!=0);
    _;
  }
  
  function approves(uint rin)
    isAuditor(msg.sender) 
    rinExists(rin)
    isNotAudited(rin){
    RINs[rin].approved=msg.sender;
  }
  
  function addAuditor(address newAuditor ) public
    isNotYetAssigned(newAuditor){
    require(creator==msg.sender);
    auditors[newAuditor]=true;
  }
}
