# phpTooAdmin

A web interface for MySQL and MariaDB faster than phpMyAdmin

## TODOs

* Reload breadcrumb only when necessary
* Add load animation on breadcrumb loading / refreshing
* Add load animation on content loading / refreshing
* Add shortcuts for controls :
** Use the first letter of the word : S for Structure
** User a number
* Create an instance id when loading a new page, store it in the get parameter and in the local storage (the context of every tabs). Allow to switch to another instance
* Use the text words instead of the key words for the tab name with controls
* Quand on ouvre un nouvel onglet alors qu'on est pas connecté sur le premier, ça marche po
* Quand on clic (ou hover) sur une clé (symbole) dans la structure, elle se met en valeur, et met en valeur les autres symboles de clés associés, ainsi que la clé dans le tableau des clés, et inversement (clic ou hover sur le tableau des clés)
* Quand on reçoit un critical (du genre requête nulle) sur le premier chargement (pas ajax), mettre une jolie erreur

## TODOs Urgents
Si je recherche te dans la recherche, Celestine sera pré-seclectionnée : c'est nul, il faut que ça passe sur test, la préselection ne doit pas être aussi forte
Utiliser des <a> en plus des onclick pour permettre des clic molette + ctrl clic, pareil dans fuzzy



# Z-index
## Tabs
1 -> 2

## CodeMirror
0 -> 6

## Fuzzy
10

## Popup
20

## Notifications
1000