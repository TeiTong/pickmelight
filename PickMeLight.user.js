// ==UserScript==
// @name         PickMe Light
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Affilié
// @author       MegaMan
// @match        https://www.amazon.fr/*
// @icon         https://i.ibb.co/Zd9vSZz/PM-ICO-2.png
// @updateURL    https://raw.githubusercontent.com/TeiTong/pickmelight/main/PickMeLight.user.js
// @downloadURL  https://raw.githubusercontent.com/TeiTong/pickmelight/main/PickMeLight.user.js
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // Fonction pour extraire l'ASIN
    function getASINfromURL(url) {
        // Expression régulière pour trouver l'ASIN dans différentes structures d'URL Amazon
        const regex = /\/(dp|gp\/product|product-reviews|gp\/aw\/d)\/([A-Za-z0-9]{10})/i;
        const match = url.match(regex);
        return match ? match[2] : null; // Retourne l'ASIN ou null si non trouvé
    }

    function isAffiliateTagPresent() {
        return window.location.search.indexOf('tag=monsieurconso-21') > -1;
    }

    //Ajout du bouton
    function addButton(asin) {
        if (!document.querySelector('#pickme-button')) {
            var priceContainer = document.querySelector('.basisPriceLegalMessage');
            if (priceContainer) {
                const affiliateButton = createButton(asin);
                // Insérez le nouveau bouton dans le DOM juste après le conteneur de prix
                priceContainer.parentNode.insertBefore(affiliateButton, priceContainer.nextSibling);
            } else {
                //priceContainer = document.querySelectorAll('snsPriceRow');
                //Selecteur du prix desktop ou mobile
                var priceContainerVar = document.getElementById('corePrice_desktop');
                if (!priceContainerVar) {
                    priceContainerVar = document.getElementById('corePrice_mobile_feature_div');
                    //Gestion pour les livres
                    if (!priceContainerVar) {
                        priceContainer = document.getElementById("bookDescription_feature_div");
                        if (priceContainer) {
                            const affiliateButton = createButton(asin);
                            priceContainer.parentNode.insertBefore(affiliateButton, priceContainer);
                        }
                    }
                }
                priceContainer = priceContainerVar.querySelector('.a-span12');
                if (priceContainer) {
                    const affiliateButton = createButton(asin);
                    //priceContainer.parentNode.insertAdjacentElement('afterend', affiliateButton);
                    priceContainer.parentNode.insertAdjacentElement('beforeend', affiliateButton);
                }
            }
        }
    }

    function createButton(asin) {
        var container = document.createElement('div');
        container.style.display = 'inline-flex';
        container.style.alignItems = 'center';

        var affiliateButton = document.createElement('a');

        affiliateButton.className = 'a-button a-button-primary a-button-small';
        affiliateButton.id = 'pickme-button';
        affiliateButton.style.marginTop = '5px'; // Pour ajouter un peu d'espace au-dessus du bouton
        affiliateButton.style.marginBottom = '5px';
        affiliateButton.style.color = 'white'; // Changez la couleur du texte en noir
        affiliateButton.style.maxWidth = '200px';
        affiliateButton.style.height = '29px';
        affiliateButton.style.lineHeight = '29px';
        affiliateButton.style.borderRadius = '20px';
        affiliateButton.style.whiteSpace = 'nowrap';
        affiliateButton.style.padding = '0 40px';
        affiliateButton.style.backgroundColor = '#CC0033';
        affiliateButton.style.border = '1px solid white';
        affiliateButton.style.display = 'inline-block';
        if (isAffiliateTagPresent()) {
            affiliateButton.innerText = 'Lien PickMe actif';
            affiliateButton.style.backgroundColor = 'green'; // Changez la couleur de fond en vert
            affiliateButton.style.color = 'white';
            affiliateButton.style.pointerEvents = 'none'; // Empêchez tout événement de clic
            affiliateButton.style.cursor = 'default';
            affiliateButton.style.border = '1px solid black';
            container.appendChild(affiliateButton);
        } else {
            affiliateButton.href = `https://pickme.alwaysdata.net/monsieurconso/index.php?asin=${asin}`;
            affiliateButton.innerText = 'Acheter via PickMe';
            affiliateButton.target = '_blank';
            var infoText = document.createElement('span'); // Créer l'élément de texte d'explication
            infoText.innerHTML = '<b>A quoi sert ce bouton ?</b>';
            infoText.style.marginLeft = '5px';
            infoText.style.color = '#CC0033';
            infoText.style.cursor = 'pointer';
            infoText.style.fontSize = '14px';
            infoText.onclick = function() {
                alert("Ce bouton permet de soutenir la communauté Vine. Il n'y a strictement aucune conséquence sur votre achat, mise à part d'aider.\n\nComment faire ?\n\nIl suffit de cliquer sur 'Acheter via PickMe' et dans la nouvelle fenêtre de cliquer sur 'Acheter sur Amazon'. Normalement le bouton sera devenu vert, il suffit alors d'ajouter le produit au panier (uniquement quand le bouton est vert) et c'est tout !\nMerci beaucoup !");
            };
            container.appendChild(affiliateButton);
            container.appendChild(infoText);
        }
        affiliateButton.style.fontSize = '14px';
        return container;
    }

    var asinProduct = getASINfromURL(window.location.href);

    if (asinProduct) {
        addButton(asinProduct);
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    asinProduct = getASINfromURL(window.location.href);
                    addButton(asinProduct);
                }
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
        return;
    }
})();
