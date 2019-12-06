$(function() {
    $(window).load(async function() {
     await App.initWeb3();
    });
  });
  App = {
    web3: null,
    contracts: {},
    candidates : {},
    tokenPrice : null,
    Voting : null,

    initWeb3: async function() {
        // Modern dapp browsers...
     if (window.ethereum) {
       App.web3 = window.ethereum;
       try {
         // Request account access
         await window.ethereum.enable();
       } catch (error) {
         // User denied account access...
         console.error("User denied account access")
       }
     }
     // Legacy dapp browsers...
     else if (window.web3) {
       App.web3 = window.web3.currentProvider;
     }
     // If no injected web3 instance is detected, fall back to Ganache
     else {
       App.web3 = new Web3.providers.HttpProvider('http://localhost:7545');
     }
     web3 = new Web3(App.web3);
     
         return App.initContract();
       },
       
    initContract: function() {
        $.getJSON('Voting.json', function(data) {
          // Get the necessary contract artifact file and instantiate it with truffle-contract
          var Artifact = data;
          console.log(data)
          App.contracts.Voting = TruffleContract(Artifact);
          App.Voting = App.contracts.Voting
          // Set the provider for our contract
          App.contracts.Voting.setProvider(App.web3);
          
          return App.populateCandidates();
        });
      },
   //=========================================================================== 
      /* Instead of hardcoding the candidates hash, we now fetch the candidate list from
 * the blockchain and populate the array. Once we fetch the candidates, we setup the
 * table in the UI with all the candidates and the votes they have received.
 */
populateCandidates:function () {
  App.Voting.deployed().then(function(contractInstance) {
    contractInstance.allCandidates.call().then(function(candidateArray) {
      console.log('show me candidates ',candidateArray)
      for(let i=0; i < candidateArray.length; i++) {
        /* We store the candidate names as bytes32 on the blockchain. We use the
         * handy toUtf8 method to convert from bytes32 to string
         */
        App.candidates[web3.toUtf8(candidateArray[i])] = "candidate-" + i;
      }
      App.setupCandidateRows();
      App.populateCandidateVotes();
      App.populateTokenData();
    });
  });
},
setupCandidateRows:function() {
  console.log(App)
  Object.keys(App.candidates).forEach(function (candidate) { 
    $("#candidate-rows").append("<tr><td>" + candidate + "</td><td id='" + App.candidates[candidate] + "'></td></tr>");
  });
},
populateCandidateVotes:function () {
  let candidateNames = Object.keys(App.candidates);
  for (var i = 0; i < candidateNames.length; i++) {
    let name = candidateNames[i];
    App.Voting.deployed().then(function(contractInstance) {
      contractInstance.totalVotesFor.call(name).then(function(v) {
        $("#" + App.candidates[name]).html(v.toString());
      });
    });
  }
},
/* Fetch the total tokens, tokens available for sale and the price of
 * each token and display in the UI
 */
populateTokenData:function () {
  App.Voting.deployed().then(function(contractInstance) {
    contractInstance.totalTokens().then(function(v) {
      $("#tokens-total").html(v.toString());
    });
    contractInstance.tokensSold.call().then(function(v) {
      $("#tokens-sold").html(v.toString());
    });
    contractInstance.tokenPrice().then(function(v) {
      tokenPrice = parseFloat(web3.fromWei(v.toString()));
      $("#token-cost").html(tokenPrice + " Ether");
    });
    web3.eth.getBalance(contractInstance.address, function(error, result) {
      $("#contract-balance").html(web3.fromWei(result.toString()) + " Ether");
    });
  });
},
//=======================================
buyTokens : function() {
  let tokensToBuy = $("#buy").val();
  let price = tokensToBuy * tokenPrice;
  $("#buy-msg").html("Purchase order has been submitted. Please wait.");
  App.Voting.deployed().then(function(contractInstance) {
    contractInstance.buy({value: web3.toWei(price, 'ether'), from: web3.eth.accounts[0]}).then(function(v) {
      $("#buy-msg").html("");
      web3.eth.getBalance(contractInstance.address, function(error, result) {
        $("#contract-balance").html(web3.fromWei(result.toString()) + " Ether");
      });
    })
  });
  App.populateTokenData();
},
//==============================
voteForCandidate : function(candidate) {
  let candidateName = $("#candidate").val();
  let voteTokens = $("#vote-tokens").val();
  $("#msg").html("Vote has been submitted. The vote count will increment as soon as the vote is recorded on the blockchain. Please wait.")
  $("#candidate").val("");
  $("#vote-tokens").val("");

  /* Voting.deployed() returns an instance of the contract. Every call
   * in Truffle returns a promise which is why we have used then()
   * everywhere we have a transaction call
   */
  App.Voting.deployed().then(function(contractInstance) {
    contractInstance.voteForCandidate(candidateName, voteTokens, {gas: 140000, from: web3.eth.accounts[0]}).then(function() {
      let div_id = App.candidates[candidateName];
      return contractInstance.totalVotesFor.call(candidateName).then(function(err,v) {
        $("#" + div_id).html(v.toString());
        $("#msg").html("");
      });
    });
  });
},
//===========================================
lookupVoterInfo : function() {
  let address = $("#voter-info").val();
  App.Voting.deployed().then(function(contractInstance) {
    contractInstance.voterDetails.call(address).then(function(v) {
      console.log
      $("#tokens-bought").html("Total Tokens bought: " + v[0].toString());
      let votesPerCandidate = v[1];
      $("#votes-cast").empty();
      $("#votes-cast").append("Votes cast per candidate: <br>");
      let allCandidates = Object.keys(App.candidates);
      for(let i=0; i < allCandidates.length; i++) {
        $("#votes-cast").append(allCandidates[i] + ": " + (votesPerCandidate[i]==undefined?0:votesPerCandidate[i]) + "<br>");
      }
    });
  });
}


 

//==========================end 
}