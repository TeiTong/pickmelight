// ==UserScript==
// @name         PickMe Light
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Ajoute le bouton affilié "Acheter via PickMe" sur les pages produits Amazon
// @author       MegaMan
// @match        https://www.amazon.fr/*
// @icon         https://vinepick.me/img/PM-ICO-2.png
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

        if (typeof element.offsetParent !== 'undefined' && element.offsetParent !== null) {
            return true;
        }

        const rects = element.getClientRects();
        return !!(rects && rects.length > 0);
    }

    function findButtonPlacement() {
        const candidates = [
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

    function createButton(asin) {
        const container = document.createElement('div');
        container.id = BUTTON_CONTAINER_ID;
        container.style.display = 'inline-flex';
        container.style.alignItems = 'center';

        const affiliateButton = document.createElement('a');
        affiliateButton.className = 'a-button a-button-primary a-button-small';
        affiliateButton.id = BUTTON_ID;
        affiliateButton.style.marginTop = '5px';
        affiliateButton.style.marginBottom = '5px';
        affiliateButton.style.color = 'white';
        affiliateButton.style.height = '29px';
        affiliateButton.style.lineHeight = '29px';
        affiliateButton.style.borderRadius = '20px';
        affiliateButton.style.whiteSpace = 'nowrap';
        affiliateButton.style.padding = '0 40px';
        affiliateButton.style.backgroundColor = '#CC0033';
        affiliateButton.style.border = '1px solid white';
        affiliateButton.style.display = 'inline-block';
        affiliateButton.style.fontSize = '14px';

        if (isAffiliateTagPresent()) {
            affiliateButton.innerText = 'Lien PickMe actif';
            affiliateButton.style.backgroundColor = 'green';
            affiliateButton.style.pointerEvents = 'none';
            affiliateButton.style.cursor = 'default';
            affiliateButton.style.border = '1px solid black';
            container.appendChild(affiliateButton);
        } else {
            affiliateButton.href = `${baseUrlPickme}/monsieurconso/product.php?asin=${asin}`;
            affiliateButton.innerText = 'Acheter via PickMe';
            affiliateButton.target = '_blank';

            const infoText = document.createElement('span');
            infoText.innerHTML = '<b>A quoi sert ce bouton ?</b>';
            infoText.style.marginLeft = '5px';
            infoText.style.color = '#CC0033';
            infoText.style.cursor = 'pointer';
            infoText.style.fontSize = '14px';
            infoText.addEventListener('click', function() {
                alert("Ce bouton permet de soutenir le discord Amazon Vine FR. Il n'y a strictement aucune conséquence sur votre achat, mise à part d'aider à maintenir les services du discord et de PickMe.\n\nComment faire ?\n\nIl suffit de cliquer sur 'Acheter via PickMe' et dans la nouvelle fenêtre de cliquer sur 'Acheter sur Amazon'. Normalement le bouton sera devenu vert, il suffit alors d'ajouter le produit au panier (uniquement quand le bouton est vert) et c'est tout !\nMerci beaucoup !");
            });

            container.appendChild(affiliateButton);
            container.appendChild(infoText);
        }

        return container;
    }

    function addButton(asin) {
        if (!asin) {
            return;
        }

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

    function scheduleButtonRefresh() {
        if (scheduleButtonRefresh.scheduled) {
            return;
        }
        scheduleButtonRefresh.scheduled = true;
        requestAnimationFrame(() => {
            scheduleButtonRefresh.scheduled = false;
            const asin = getASINfromURL(window.location.href);
            if (asin) {
                addButton(asin);
            }
        });
    }

    function init() {
        const asin = getASINfromURL(window.location.href);
        if (!asin) {
            return;
        }

        addButton(asin);

        const bodyObserver = new MutationObserver(scheduleButtonRefresh);
        bodyObserver.observe(document.body, {
            childList: true,
            subtree: true
        });

        const buyboxAccordion = document.getElementById('buyboxAccordion');
        if (buyboxAccordion) {
            const accordionObserver = new MutationObserver(scheduleButtonRefresh);
            accordionObserver.observe(buyboxAccordion, {
                attributes: true,
                subtree: true,
                attributeFilter: ['class', 'style', 'aria-hidden']
            });
        }

        window.addEventListener('popstate', scheduleButtonRefresh);
        window.addEventListener('hashchange', scheduleButtonRefresh);

        let lastHref = window.location.href;
        setInterval(() => {
            if (lastHref !== window.location.href) {
                lastHref = window.location.href;
                scheduleButtonRefresh();
            }
        }, 1000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
