const fs = require('fs');
const path = require('path');
const https = require('https');

const images = [
  {
    name: 'hero-bg.jpg',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCMpWlKxKSP4AwBBLnX_0vAG1nJkpT2y6q92L8gNCcVYMmOmqMt96cpG0clQRu--_zBiiPZS6JUUaw9RDsHxwLMx2wtshL7EmTG3Kf52bJeQmhYGJVKGnxQkTwk_X3CMksd-ZNlMQ1lPGPFxqzAb3IjgiNNdBOa9PKUuzZGCmNU1O2EtkIUtha8GrHVYMpBTha0Zo9HrRDAy_zKMAitdvFkNQnUxbHPf0cmWS1mk2Y8'
  },
  {
    name: 'dive-bg.jpg',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBpfJSsMQ8vYMWv21lSyycA1y3jIFhojeI_mhu5lDLsimbYT40MqtRmTv1PB5mTj4tKJslxqWsJcs1H7DzU89yVRhEB4ovrGXmNFmhoMBnO4p3Wr0yKxCvrS_2wDmCS2Islvl6irmIFbislIkSBCUarZQCjAio3Rrm6msa5EJeFzTt89F2emqndWLDy7H9Jxkbkc3uKYNfbgTH_JU3_di_Q1bKO7sRlY8CwA_uw4vnr'
  },
  {
    name: 'coral-reef.jpg',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAXj5n67MvztVDzkA7CxRlWjbaGoexiCtm7G2IgsgmWlAQ8Tmxr95WeFe7ZQ6n1br4kbOnA5j_WRjtCReFn9AjicxmtTR6GI-9zZ6bfKRaxvsd_vLpJWOv6jZVDiWuBffluuVqLvO_P8Hr13s1dxtxtQaa-idQv6bcJeaMc2zKLQF6GpU5b86zt1OcGJ7O97-q26kDZIH4t7PDNULGC3wWPivbFz3pAj9x9kwots6hB'
  },
  {
    name: 'night-diving.jpg',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBLGj6VtgmYxJ449HTVCvZXD9eh76KWYAiGnW0OH1ii-WIn9Bg8c9hLpxQYK6VIsnCDoCfctStS0DDpUWCFcQpWZ151WONpa-8hz8mOoFrIV9_b_Zc6EzlpzfpIlsW4mtv8yGtZhNRbyZD7ihcAzd3W6i1g9vyelMfD3OFDSXt8NLNzC8NLHynyX8d6O1g6XS094g7v6wd7O89ToItcf6f8KhXcASU8orKBTFcIw2V4'
  },
  {
    name: 'ocean-spa.jpg',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDgZ7tQLVpUuYDSwf77WRhouGf-krztbC-X6XgAf0Haj4DpEKOzzt7n7f2zeec9wrEMqSwVD6VY2GEfpayZ5X1KJ2TrU_JwpizM-Jba5PzW6Z_RLBC1I4zXe7_B9621fwAkq80ebGGQ_zZvdgyNz5kEh7pdpV5iEwJ3StA4S7F3oYm04MLAQs3yLjLomocSjQ40mVnB2fyKkDFXujPZ8q6Fzql1fTq85U_D6ps8Ad_-'
  },
  {
    name: 'sea-dining.jpg',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBrnGiAgDTh5ZE5mQ2MspYRSt1gQnQEcIH73SAoO6qN-KZ7fyQ-BLHNohyy87Lt_FUUyfHFvncFLJxBLwC_ZHux-pYSZWgyex58SZ1fwaR50BQP3f4reWWZv272essy331hHGChIa2TKxOr29UgfI4tyaYd29_y4Hg5yOkNOXT4Jzvo6uHfy4_8SIjgLX1e_tMXOVT70QlMolCgUftcgHIgWiRMu_AjLkKMMR58ZoFU'
  },
  {
    name: 'overwater-villa.jpg',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCBM0nE6Ut1Y4khxNIEM_pG85ZB05-h1UXddcgLKruGabLgyaDEAgvv9aX6vKcN7Nt9qBwf7gE1JsnbRoScTbuPcfJD0hQrBamtx3UU6SJXGXDtJEhQAFSoy9Uyryf0jnYIHYEDV5mKbuXs1brpoxc3t8r3Z9z_DwpuMXm5HgkGTkF2Ypnvo50Sxbgrow21Tw0LFfDmqOQ9Sy_TheSU9RNfQioxNnImytTQZ0hEtvXs'
  },
  {
    name: 'beach-villa.jpg',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAH-vdL6XzAk1UussrJ5Ixl3DFOCqu-JvU0VBhJIQQE-a4reCzZ6vzawPhrknILRv7HLlvRidRHpYRm7J3jMnl-p4FcIIPdJvDtegM6fMbpW9j19bDf0BRwoZ8YNYzOPI4sIr1aVC4M8uVdrqZ7w4ZYMU0yqr6vze0LzXCVqCktgkFTHVoeNGQtYzF1akC6qadio5VEmNb7Np8IoA_0ClSMp0XxZ3uurPqEjC0UVIVD'
  },
  {
    name: 'cliff-villa.jpg',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCZQP7gMAhncBpGK1yBjydXrrsoQc6HqBXgYr3fVVTI2C8ToMqR1ERn8KLem6M_hlSj8Iw32QnhI0w1Bc_tLwZYVAVRmKineMyyOd0Sse9Lwzvtj1iIrFk95KdzxG03JhDfMVQVryStO6u5FO9ACR1sRxwHt0TPfX5Fukt_FISZmkArKFI-H8ZQv3IyTHhCjpAVAOQRoe_M4uatXse2WSJV4_V4iP1HHK5U-WJ7sjwH'
  },
  {
    name: 'sunset-bg.jpg',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCV5jxFmrArRE7apBI-sf3nDiT3a_8fsQpTaSm7gVQmQ6k0Plc3tjCEtKvZ1q2Ngaga0kMnDbCY94mqVKL036dTS0geFBwVjKPRzr09Zatunnl2ekoCLtVzlmw7zMcb9dx4C-dYX_xLAG1IZCBNdvhYrGpw4T0s3mtQ25QJ8OnBIs5N_uzHyFfSEZeImBuv5T2AszMI0Ysnn5EJOsXLOnP9bVjXKCP9BH6M4M7WBSEC'
  }
];

const destDir = path.join(__dirname, 'public', 'images');
fs.mkdirSync(destDir, { recursive: true });

async function download(item) {
  const destPath = path.join(destDir, item.name);
  return new Promise((resolve, reject) => {
    https.get(item.url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, redirectRes => {
          const file = fs.createWriteStream(destPath);
          redirectRes.pipe(file);
          file.on('finish', () => { file.close(); resolve(); });
        }).on('error', reject);
      } else {
        const file = fs.createWriteStream(destPath);
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      }
    }).on('error', reject);
  });
}

(async () => {
  for (const item of images) {
    console.log(`Downloading ${item.name}...`);
    await download(item);
  }
  console.log('All images downloaded successfully!');
})();
