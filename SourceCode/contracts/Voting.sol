pragma solidity >=0.4.21 <0.6.0;
contract Voting {


  bytes32[] public candidateList;
  uint public totalTokens;
  uint public balanceTokens;
  uint public tokenPrice;
  
  constructor(uint tokens, uint pricePerToken) public {
    candidateList.push("Ebad");
    candidateList.push("Mike");
    candidateList.push("Hassan");

    totalTokens = tokens;
    balanceTokens = tokens;
    tokenPrice = pricePerToken;
  }

   function allCandidates()public view  returns (bytes32[] memory) {
    return candidateList;
  }
//========================================================
  struct voter {
    address voterAddress;
    uint tokensBought;
    uint[] tokensUsedPerCandidate;
  }
  mapping (bytes32 => uint) public votesReceived;

  function totalVotesFor(bytes32 candidate)public view  returns (uint) {
    return votesReceived[candidate];
  }
  function totalTokensUsed(uint[] memory tokensUsedPerCandidate) private pure returns (uint) {
    uint totalUsedTokens = 0;
    for(uint i = 0; i < tokensUsedPerCandidate.length; i++) {
      totalUsedTokens += tokensUsedPerCandidate[i];
    }
    return totalUsedTokens;
  }

  function tokensSold()public  view returns (uint) {
    return totalTokens - balanceTokens;
  }
  //=====================================================
  mapping (address => voter) public voterInfo;

  function buy()public payable returns (uint) {
    uint tokensToBuy = msg.value / tokenPrice;
    require(tokensToBuy <= balanceTokens, "Token not available");
    voterInfo[msg.sender].voterAddress = msg.sender;
    voterInfo[msg.sender].tokensBought += tokensToBuy;
    balanceTokens -= tokensToBuy;
    return tokensToBuy;
  }


  //=====================================
  function voterDetails(address user)public view  returns (uint, uint[] memory) {
    return (voterInfo[user].tokensBought, voterInfo[user].tokensUsedPerCandidate);
  }
  //===================================
  function transferTo(address payable account) public {
    account.transfer(address(this).balance);
  }
  //=======================
  function voteForCandidate(bytes32 candidate, uint votesInTokens) public {
    uint index = indexOfCandidate(candidate);
    require(index != uint(-1)," Candidate name does not Exists ");
    if (voterInfo[msg.sender].tokensUsedPerCandidate.length == 0) {
      for(uint i = 0; i < candidateList.length; i++) {
        voterInfo[msg.sender].tokensUsedPerCandidate.push(0);
      }
    }
    uint availableTokens = voterInfo[msg.sender].tokensBought - totalTokensUsed(voterInfo[msg.sender].tokensUsedPerCandidate);
    require(availableTokens >= votesInTokens, " Cannot give more Votes than available ");

    votesReceived[candidate] += votesInTokens;

    // Store how many tokens were used for this candidate
    voterInfo[msg.sender].tokensUsedPerCandidate[index] += votesInTokens;
  }
  
   function indexOfCandidate(bytes32 candidate) view public returns (uint) {
    for(uint i = 0; i < candidateList.length; i++) {
      if (candidateList[i] == candidate) {
        return i;
      }
    }
    return uint(-1);
  }
  //=====================================
}