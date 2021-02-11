const arweave = Arweave.init();
let jwk;

function readFile(input) {
  let file = input.files[0];
  console.log("runned")

  let reader = new FileReader();

  reader.readAsText(file);

  reader.onload = async function() {
    
    jwk = JSON.parse(reader.result);

    }
  reader.onerror = function() {
    console.log(reader.error);
  };

};


async function login() {
  const wallet_address = await arweave.wallets.jwkToAddress(jwk)
  const winston_balance = await arweave.wallets.getBalance(wallet_address)
  const ar_balance = await arweave.ar.winstonToAr(winston_balance)

  const wallet_state = await isVerified(jwk["n"]) ? "verified" : "unverified";

  document.getElementById('logged-wallet').innerHTML = (`logged as: <b>${wallet_address}</b> (${wallet_state}) <br>
    generating max capacity: ~ <b>${await max_capacity(ar_balance)}</b> static fQR`);
  



}



async function max_capacity(balance) {

  const api = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=arweave&vs_currencies=usd");
  const reponse = await api.json();
  const ar_in_usd = reponse["arweave"]["usd"];

  const usd_balance = balance * ar_in_usd
  
  return Math.floor(usd_balance / 0.005)
}


async function usdToAr(usd) {


  const api = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=arweave&vs_currencies=usd");
  const reponse = await api.json();
  const ar_in_usd = reponse["arweave"]["usd"];

  return String(usd / ar_in_usd)
}



async function isVerified(n) {

  const vwa_tx = await arweave.wallets.getLastTransactionID("MtgIRVxVRaooHlL3vHE4Bu875vtnDelgJzwrZ7WnDyo");
  const vwa = await arweave.transactions.getData(vwa_tx, {decode: true, string: true})
  const wallets_array = vwa.split(' ');

  const has = wallets_array.indexOf(n)

  return bool = has >= 0 ? true : false;

  
}

async function generate() {

  const student_name = document.getElementById('student').value;
  const student_bd = document.getElementById('student-bd').value;
  const course_name = document.getElementById('course-name').value
  const course_date = document.getElementById('course-date').value
  const trainers = document.getElementById('trainers').value;
  
  const metadata = `<!DOCTYPE html><html><head><title>fQR Verification</title><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta http-equiv="X-UA-Compatible" content="ie=edge"><style>table,th,td{border: 1px solid black;}</style></head><body><center><h1>ICTD certificate</h1></center> <br><br><center><div><table><tr><th>Data</th><th>info</th></tr><tr><td>Student Name</td><td>${student_name}</td></tr><tr><td>Course Name</td><td>${student_bd}</td></tr><tr><td>Course Duration (Hours)</td><td>${course_name}</td></tr><tr><td>Date Of Issuance</td><td>${course_date}</td></tr><tr><td>Accredited Trainers</td><td>${trainers}</td></tr></table></div></center><div style="margin-left: 1em"><p>Manual checking: to check data's legitimacy, please go to <a href="https://viewblock.io/arweave">viewblock</a> and input the transaction ID to check the generator address </p></div></body></html>`

  const transaction = await arweave.createTransaction({
    data: metadata
  }, jwk);

  transaction.addTag('Content-Type', 'text/html');
  transaction.addTag("App-Name", "fQR-Weave");
  transaction.addTag("Version", "0.1.5");
  transaction.addTag("Type", "static");

  await arweave.transactions.sign(transaction, jwk);
  const response = await arweave.transactions.post(transaction);

  const transaction_fee = await arweave.createTransaction({
    target: 'BbODAb919DcZjX-50a2dzR1EvLK8zbGpr47bQikGCm4',
    quantity: arweave.ar.arToWinston(await usdToAr(0.005))
      }, jwk);
  transaction_fee.addTag("App-Name", "fQR-Weave");
  transaction_fee.addTag("Version", "0.1.5");
  transaction_fee.addTag("Type", 'fee');

  await arweave.transactions.sign(transaction_fee, jwk);
  await arweave.transactions.post(transaction_fee);

  document.getElementById("prdct_id").innerHTML = (`<a href="https://arweave.net/${transaction.id}">Certification ID</a>`);

  // Generating a QR code from transaction.id string
  const typeNumber = 4;
  const errorCorrectionLevel = 'L';
  const qr = qrcode(typeNumber, errorCorrectionLevel);


  qr.addData(transaction.id);
  qr.make();
   
  document.getElementById('placeHolder').innerHTML = qr.createImgTag();


  
};

