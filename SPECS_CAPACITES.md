# WARBLAST — Spécifications officielles des capacités

Statut : une capacité est « validée » seulement après confirmation d'Alou. Ne pas la modifier sans son accord.

## EAU (fruit bleu) — spécification officielle
Famille : contrôle / repoussement. Commune aux 5 niveaux : 5 utilisations, recharge indépendante, direction donnée par le stick d'attaque, déclenchement automatique au relâchement, vrais dégâts, vraie poussée, collisions avec les murs.

| Niv. | Apparence | Animation | Comportement | Effets |
|---|---|---|---|---|
| 1 | Une vague d'eau bleue à crête blanche | Elle avance en s'élargissant puis s'estompe | Une vague dans la direction visée | Dégâts 17, poussée modérée, touche chaque ennemi une fois |
| 2 | Deux vagues | La deuxième part dès que la première est finie, sans nouvelle action | Deux vagues successives, la 2e plus longue et plus large | Dégâts 2 x 20, la 2e pousse plus loin |
| 3 | Trois vagues | Enchaînement automatique des 3 vagues | Trois vagues successives, la 3e la plus puissante | Dégâts 3 x 23, la 3e pousse le plus fort (x1,25) |
| 4 | Une main d'eau géante sort du sol sous UN seul adversaire ciblé (le plus proche dans la direction visée, portée 340 px) | Montée, fermeture des doigts, soulèvement (58 px), lancer, puis la main s'enfonce et disparaît | Attrape exactement un ennemi, l'étourdit, le projette loin (poussée 2600) | Dégâts 80, étourdissement ~1 s |
| 5 | Rayon d'action visible autour du joueur (260 px) et plusieurs mains d'eau | Toutes les mains sortent en même temps, attrapent, soulèvent, lancent, s'estompent | Chaque ennemi dans le rayon (10 max) est attrapé par sa propre main | Dégâts 55 par ennemi, étourdissement, projection |

Notes techniques : code dans `evolve.js` (bloc EAU), fx `tide`, liste `G.hands`, `WB.updateHands`, `WB.drawHands`. Le silence de l'ancienne version a été retiré (hors spécification). Aucune couche réseau n'existe dans le jeu : la synchronisation multijoueur n'a pas pu être testée.

## FEU (fruit piment) — spécification officielle
Commune : 5 utilisations, brûlure avec fumée noire et dégâts continus jusqu'à l'extinction, appui direct = ciblage automatique de l'adversaire le plus proche.

| Niv. | Apparence | Comportement | Effets |
|---|---|---|---|
| 1 | Une boule de feu (flammes jaunes, orange, rouges) | Une boule vers la cible | Dégâts 13 + brûlure |
| 2 | Deux boules de feu | Lancées ensemble, légèrement écartées | 2 x 16 + brûlure |
| 3 | Rayon de feu continu | 1,1 s, trajectoire fixée au tir, portée 340 px | 5 par impulsion (0,1 s) + brûlure |
| 4 | Deux rayons de feu | 1,3 s, deux trajectoires voisines | 5 par impulsion et par rayon + brûlure |
| 5 | Lance-flammes : masse de flammes en continu | 2,4 s, portée 390 px, cône large, suit doucement l'ennemi le plus proche, touche plusieurs cibles | 6 par impulsion (0,12 s) + brûlure ; laisse des flammes au sol (3,6 s) qui infligent 2 + petite brûlure toutes les 0,3 s |

Un seul jet de feu à la fois par lanceur (pas de charge perdue pendant un jet).

## APPUI DIRECT
Un appui sur une capacité de l'analogue (ou sur l'analogue) la déclenche aussitôt sur l'adversaire le plus proche, sans bouger l'analogue. Sans adversaire à portée : rien n'est consommé (sauf bouclier et invisibilité, utilisables sans cible). Pousser l'analogue reste possible pour viser à la main.

## FUSION (niveau 7 et plus)
- Bouton FUSIONNER (au-dessus de l'analogue) si au moins 2 capacités y sont placées ; DÉFUSIONNER pour les séparer. Capacités non modifiables pendant la fusion.
- Un seul disque de fusion : niveau commun = moyenne des niveaux arrondie au supérieur (max 5), plus de niveaux indépendants.
- Un tir fusionné consomme 1 charge par capacité, les enchaîne toutes les 0,6 s sur les adversaires les plus proches (un différent à chaque fois si possible), puis une attaque combinée finale (zone 120 + 12 x n px, dégâts 14 + 9 x n, poussée).
- Recharge de fusion : 7 s + 2,5 s par capacité (12 s pour 2), bien supérieure aux recharges normales ; le disque affiche le compte à rebours.
- Les capacités reviennent individuelles à la défusion, avec leurs charges propres.

## VENT (fruit poire) — spécification officielle
Dégâts (14 + 4 x niveau) et étourdissement (1 + 0,15 x niveau) d'origine conservés. Portée niv.1 = 270 px.

| Niv. | Comportement | Portée |
|---|---|---|
| 1 | Un souffle vers l'ennemi le plus proche (ou celui dans la direction visée) ; un seul ennemi est repoussé | 270 |
| 2 | Onde à 360° simultanée, tous les ennemis du rayon sont repoussés | 540 (exactement 2 x niv.1) |
| 3 | Un tourbillon visible : tourne autour du joueur en s'éloignant en spirale (3,6 s). Capture 2 personnages au maximum | 340 |
| 4 | Deux tourbillons qui tournent autour du joueur et l'accompagnent 6 s. Chacun capture 2 personnages au plus ; en capturant, il quitte le joueur et emporte sa prise | 260 |
| 5 | Onde 360° immédiate, puis (0,35 s après) 4 tourbillons : 2 défensifs (orbite, 8 s, partent avec leur prise) et 2 offensifs (7 s, poursuivent les adversaires sur la carte) | 540 |

Capture : le personnage est étourdi (aucune action), soulevé et entraîné 0,9 s, puis lancé violemment à l'opposé du lanceur avec les dégâts du vent. Une cible relâchée est immunisée 1,4 s contre une nouvelle capture. Les tourbillons disparaissent si leur propriétaire meurt.

## RAYON D'ACTION (toutes capacités)
Un cercle à la portée de chaque capacité prête placée dans l'analogue est dessiné autour du joueur ; il s'intensifie quand un ennemi y entre. Il est dessiné uniquement pour le joueur local, jamais pour les autres.
