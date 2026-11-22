import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { isBirthdayOnDate } from '../components/Membres';
import { addDays } from 'date-fns';
import type { Notification } from '../types';

export function useNotifications() {
  const { data, setActiveModule } = useApp();

  const notifications = useMemo<Notification[]>(() => {
    const now = new Date();
    const tomorrow = addDays(now, 1);
    const in7Days = addDays(now, 7);
    const result: Notification[] = [];

    // 1. Stocks bas
    const lowStock = data.stocks.articles.filter(
      a => a.quantite <= a.seuil_alerte
    );
    if (lowStock.length > 0) {
      result.push({
        id: 'stock-low',
        type: 'stock',
        title: 'Stock faible',
        message: `${lowStock.length} article${lowStock.length > 1 ? 's' : ''} sous le seuil d'alerte`,
        count: lowStock.length,
        icon: 'Package',
        color: 'text-orange-600 dark:text-orange-400',
        module: 'stocks',
      });
    }

    // 2. Dons en attente
    const pendingDons = data.dons.filter(d => d.statut === 'en_attente');
    if (pendingDons.length > 0) {
      result.push({
        id: 'don-pending',
        type: 'don',
        title: 'Dons en attente',
        message: `${pendingDons.length} don${pendingDons.length > 1 ? 's' : ''} à valider`,
        count: pendingDons.length,
        icon: 'Heart',
        color: 'text-rose-600 dark:text-rose-400',
        module: 'dons',
      });
    }

    // 3. Événements à venir (7 prochains jours)
    const upcomingEvents = data.evenements.filter(e => {
      const d = new Date(e.date);
      return d >= now && d <= in7Days && e.statut !== 'annule' && e.statut !== 'termine';
    });
    if (upcomingEvents.length > 0) {
      result.push({
        id: 'event-upcoming',
        type: 'event',
        title: 'Événements à venir',
        message: `${upcomingEvents.length} événement${upcomingEvents.length > 1 ? 's' : ''} dans les 7 prochains jours`,
        count: upcomingEvents.length,
        icon: 'Calendar',
        color: 'text-blue-600 dark:text-blue-400',
        module: 'evenements',
      });
    }

    // 4. Anniversaires (aujourd'hui + demain)
    const birthdays = data.membres.filter(m => {
      if (!m.anniversaire) return false;
      return isBirthdayOnDate(m.anniversaire, now) || isBirthdayOnDate(m.anniversaire, tomorrow);
    });
    if (birthdays.length > 0) {
      const names = birthdays.map(m => `${m.prenom} ${m.nom}`).join(', ');
      result.push({
        id: 'birthday-upcoming',
        type: 'birthday',
        title: 'Anniversaires',
        message: birthdays.length === 1
          ? `Aujourd'hui : ${names}`
          : `${birthdays.length} anniversaires : ${names}`,
        count: birthdays.length,
        icon: 'Cake',
        color: 'text-purple-600 dark:text-purple-400',
        module: 'membres',
      });
    }

    return result;
  }, [data.stocks.articles, data.dons, data.evenements, data.membres]);

  const totalCount = useMemo(
    () => notifications.reduce((sum, n) => sum + n.count, 0),
    [notifications]
  );

  const navigate = (module: Notification['module']) => {
    setActiveModule(module);
  };

  return { notifications, totalCount, navigate };
}
