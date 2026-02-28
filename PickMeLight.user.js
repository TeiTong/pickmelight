// ==UserScript==
// @name         PickMe Light
// @namespace    http://tampermonkey.net/
// @version      1.6
// @description  Ajoute le bouton affilié "Acheter via PickMe" sur les pages produits Amazon
// @author       MegaMan
// @match        https://www.amazon.fr/*
// @icon         https://vinepick.me/img/PM-icon.png
// @updateURL    https://raw.githubusercontent.com/teitong/pickmelight/main/PickMeLight.user.js
// @downloadURL  https://raw.githubusercontent.com/teitong/pickmelight/main/PickMeLight.user.js
// @run-at       document-idle
// @noframes
// ==/UserScript==

(function() {
    'use strict';

    if (window.__PML__) {
        return;
    }
    window.__PML__ = true;

    const baseUrlPickme = 'https://vinepick.me';
    const BUTTON_CONTAINER_ID = 'pickme-button-container';
    const BUTTON_ID = 'pickme-button';

    function getASINfromURL(url) {
        const regex = /\/(dp|gp\/product|gp\/aw\/d|gp\/offer-listing)\/([A-Za-z0-9]{10})/i;
        const match = url.match(regex);
        return match ? match[2] : null;
    }

    function isAffiliateTagPresent() {
        return window.location.search.indexOf('tag=monsieurconso-21') > -1;
    }

    function isElementVisible(element) {
        if (!element) {
            return false;
        }

        if (typeof element.offsetParent !== 'undefined') {
            if (element.offsetParent !== null) {
                return true;
            }
        }

        const rects = element.getClientRects();
        return rects && rects.length > 0;
    }

    function findButtonPlacement() {
        const candidates = [
            {
                selector: '#addToCart_feature_div',
                getPlacement: element => ({ type: 'before', node: element })
            },
            {
                selector: '#addToCart-button',
                getPlacement: element => {
                    const targetSection = element.closest('.a-button-stack') || element.closest('.a-section') || element;
                    return { type: 'before', node: targetSection };
                }
            },
            {
                selector: '#bazaar-buybox-atc-button',
                getPlacement: element => {
                    const targetSection = element.closest('.a-button-stack') || element.closest('.a-section') || element;
                    return { type: 'before', node: targetSection };
                }
            },
            {
                selector: '#add-to-cart-button',
                getPlacement: element => {
                    const targetSection = element.closest('.a-button-stack') || element.closest('.a-section') || element;
                    return { type: 'before', node: targetSection };
                }
            },
            {
                selector: '#corePriceDisplay_desktop_feature_div',
                getPlacement: element => {
                    const targetSection = element.querySelector('.a-section.a-spacing-none') || element;
                    return { type: 'append', node: targetSection };
                }
            },
            {
                selector: '#corePriceDisplay_mobile_feature_div',
                getPlacement: element => ({ type: 'append', node: element })
            },
            {
                selector: '#buyboxAccordion .a-accordion-active .basisPriceLegalMessage',
                getPlacement: element => ({ type: 'after', node: element })
            },
            {
                selector: '.basisPriceLegalMessage',
                getPlacement: element => ({ type: 'after', node: element })
            },
            {
                selector: '#buyboxAccordion .a-accordion-active .priceToPay',
                getPlacement: element => {
                    const parentSection = element.closest('.a-section');
                    if (parentSection && isElementVisible(parentSection)) {
                        return { type: 'append', node: parentSection };
                    }
                    return null;
                }
            },
            {
                selector: '#corePrice_desktop .a-span12',
                getPlacement: element => {
                    const parent = element.parentNode || element;
                    return { type: 'append', node: parent };
                }
            },
            {
                selector: '#corePrice_mobile_feature_div',
                getPlacement: element => ({ type: 'append', node: element })
            },
            {
                selector: '#bookDescription_feature_div',
                getPlacement: element => ({ type: 'before', node: element })
            }
        ];

        for (const candidate of candidates) {
            const elements = Array.from(document.querySelectorAll(candidate.selector));
            for (const element of elements) {
                if (!isElementVisible(element)) {
                    continue;
                }

                const placement = candidate.getPlacement(element);
                if (placement) {
                    return placement;
                }
            }
        }

        return null;
    }

    function updateButtonLink(asin) {
        const affiliateAnchor = document.querySelector(`#${BUTTON_ID}`);
        if (affiliateAnchor && !isAffiliateTagPresent()) {
            affiliateAnchor.href = `${baseUrlPickme}/monsieurconso/product.php?asin=${asin}`;
        }
    }

    function insertButtonContainer(container, placement) {
        if (!placement || !placement.node) {
            return;
        }

        if (placement.type === 'after') {
            const parentNode = placement.node.parentNode;
            if (!parentNode) {
                return;
            }
            if (container.parentNode !== parentNode || container.previousSibling !== placement.node) {
                parentNode.insertBefore(container, placement.node.nextSibling);
            }
        } else if (placement.type === 'append') {
            if (container.parentNode !== placement.node) {
                placement.node.appendChild(container);
            } else if (container !== placement.node.lastElementChild) {
                placement.node.appendChild(container);
            }
        } else if (placement.type === 'before') {
            const parentNode = placement.node.parentNode;
            if (!parentNode) {
                return;
            }
            if (container.parentNode !== parentNode || container.nextSibling !== placement.node) {
                parentNode.insertBefore(container, placement.node);
            }
        }
    }

    function addButton(asin) {
        const placement = findButtonPlacement();
        if (!placement) {
            return;
        }

        let buttonContainer = document.querySelector(`#${BUTTON_CONTAINER_ID}`);

        if (!buttonContainer) {
            buttonContainer = createButton(asin);
        } else {
            updateButtonLink(asin);
        }

        insertButtonContainer(buttonContainer, placement);
    }

    function addButtonsInOfferList(asin) {
        const offerColumns = document.querySelectorAll('.aod-atc-column');
        if (!offerColumns.length) {
            return;
        }

        offerColumns.forEach(offerColumn => {
            if (offerColumn.querySelector('.pickme-offer-button')) {
                return;
            }

            const addToCartButton = offerColumn.querySelector('.aod-atc-generic-btn-desktop');
            const addToCartWidth = addToCartButton?.getBoundingClientRect().width;
            const addToCartHeight = addToCartButton?.getBoundingClientRect().height;

            const offerButton = document.createElement('a');
            offerButton.className = 'a-button a-button-primary pickme-offer-button';
            offerButton.href = baseUrlPickme + `/monsieurconso/product.php?asin=${asin}`;
            offerButton.target = '_blank';
            offerButton.style.display = 'flex';
            offerButton.style.alignItems = 'center';
            offerButton.style.justifyContent = 'center';
            offerButton.style.width = addToCartWidth ? `${addToCartWidth}px` : '100%';
            offerButton.style.height = addToCartHeight ? `${addToCartHeight}px` : '34px';
            offerButton.style.marginTop = '6px';
            offerButton.style.backgroundColor = '#CC0033';
            offerButton.style.border = '1px solid #CC0033';
            offerButton.style.boxSizing = 'border-box';
            offerButton.style.textDecoration = 'none';

            const offerButtonText = document.createElement('span');
            offerButtonText.className = 'a-button-text';
            offerButtonText.style.color = 'white';
            offerButtonText.style.fontWeight = 'bold';
            offerButtonText.style.fontSize = '11px';
            offerButtonText.style.lineHeight = '1';
            offerButtonText.textContent = isAffiliateTagPresent() ? 'Lien PickMe actif' : 'Acheter via PickMe';

            if (isAffiliateTagPresent()) {
                offerButton.style.backgroundColor = 'green';
                offerButton.style.border = '1px solid green';
                offerButton.style.pointerEvents = 'none';
                offerButton.style.cursor = 'default';
            }

            offerButton.appendChild(offerButtonText);
            offerColumn.appendChild(offerButton);
        });
    }

    function submitPost(asin) {
        var form = document.createElement('form');
        form.method = 'POST';
        form.action = baseUrlPickme + '/monsieurconso/top.php';
        form.target = '_blank';

        var asinField = document.createElement('input');
        asinField.type = 'hidden';
        asinField.name = 'asin';
        asinField.value = asin;

        form.appendChild(asinField);

        document.body.appendChild(form);
        form.submit();
    }

    function createButton(asin) {
        var container = document.createElement('div');
        container.id = BUTTON_CONTAINER_ID;
        container.style.display = 'block';
        container.style.width = '100%';
        container.style.textAlign = 'center';

        var affiliateButton = document.createElement('a');
        affiliateButton.className = 'a-button a-button-primary a-button-span12';
        affiliateButton.id = BUTTON_ID;
        affiliateButton.style.marginTop = '5px';
        affiliateButton.style.marginBottom = '2px';
        affiliateButton.style.color = 'white';
        affiliateButton.style.whiteSpace = 'nowrap';
        affiliateButton.style.backgroundColor = '#CC0033';
        affiliateButton.style.border = '1px solid white';
        affiliateButton.style.display = 'flex';
        affiliateButton.style.alignItems = 'center';
        affiliateButton.style.justifyContent = 'center';
        affiliateButton.style.width = '100%';
        affiliateButton.style.minHeight = '38px';
        affiliateButton.style.padding = '0 12px';
        affiliateButton.style.boxSizing = 'border-box';
        affiliateButton.style.textAlign = 'center';
        affiliateButton.style.fontWeight = 'bold';

        if (isAffiliateTagPresent()) {
            affiliateButton.innerText = 'Lien PickMe actif';
            affiliateButton.style.backgroundColor = 'green';
            affiliateButton.style.color = 'white';
            affiliateButton.style.pointerEvents = 'none';
            affiliateButton.style.cursor = 'default';
            affiliateButton.style.marginBottom = '8px';
            affiliateButton.style.border = '1px solid black';
            container.appendChild(affiliateButton);
        } else {
            /*affiliateButton.onclick = function() {
                submitPost(asin);
            };*/
            affiliateButton.href = baseUrlPickme + `/monsieurconso/product.php?asin=${asin}`;
            affiliateButton.innerText = 'Acheter via PickMe';
            affiliateButton.target = '_blank';
            var infoText = document.createElement('span');
            infoText.innerHTML = '<b>A quoi sert ce bouton ?</b>';
            infoText.style.marginTop = '2px';
            infoText.style.marginBottom = '4px';
            infoText.style.display = 'block';
            infoText.style.width = '100%';
            infoText.style.textAlign = 'center';
            infoText.style.color = '#CC0033';
            infoText.style.cursor = 'pointer';
            infoText.style.fontSize = '14px';
            infoText.onclick = function() {
                alert("Ce bouton permet de soutenir le discord Amazon Vine FR. Il n'y a strictement aucune conséquence sur votre achat, mise à part d'aider à maintenir les services du discord et de PickMe.\nVous pourrez réclamer votre achat sur PickMe Web d'ici 24h afin d'augmenter votre score d'activité et éviter d'être AFK.\n\nComment faire ?\n\nIl suffit de cliquer sur 'Acheter via PickMe' et dans la nouvelle fenêtre de cliquer sur 'Acheter sur Amazon'. Normalement le bouton sera devenu vert, il suffit alors d'ajouter le produit au panier (uniquement quand le bouton est vert) et c'est tout !\nMerci beaucoup !");
            };
            container.appendChild(affiliateButton);
            container.appendChild(infoText);
        }
        affiliateButton.style.fontSize = '14px';
        document.querySelector('#haul-buybox-wrapper')?.style.setProperty('height', 'auto', 'important');
        return container;
    }

    var asinProduct = getASINfromURL(window.location.href);
    function asinReady() {
        if (asinProduct) {
            addButton(asinProduct);
            addButtonsInOfferList(asinProduct);
            const observer = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        asinProduct = getASINfromURL(window.location.href);
                        addButton(asinProduct);
                        addButtonsInOfferList(asinProduct);
                    }
                });
            });
            observer.observe(document.body, { childList: true, subtree: true });
        }
    }

    //Fix iPhone
    if (document.readyState !== 'loading') {
        asinReady();
    }
    else {
        document.addEventListener('DOMContentLoaded', function () {
            asinReady();
        });
    }
})();
