import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { checkRateLimit, clearUserLimit, getUserStatus } from '../utils/rateLimiter';
import { triggerManualBackup, listBackups } from '../data/playerManager';

const ADMIN_USER_ID = process.env.ADMIN_USER_ID;

export async function handleAdminCommand(interaction: ChatInputCommandInteraction) {
  if (interaction.user.id !== ADMIN_USER_ID) {
    await interaction.reply({ content: '⛔ You do not have permission to use this command.', ephemeral: true });
    return;
  }

  const subcommand = interaction.options.getSubcommand();

  if (subcommand === 'ratelimit') {
    const action = interaction.options.getString('action', true);
    const targetUser = interaction.options.getUser('user', true);

    if (action === 'view') {
      const status = getUserStatus(targetUser.id);
      await interaction.reply({
        content: `**Rate Limit Status for ${targetUser.tag}**\nCalls in last 60s: ${status.calls}\nOldest call: ${status.oldestCall ? new Date(status.oldestCall).toLocaleTimeString() : 'None'}`,
        ephemeral: true
      });
    } else if (action === 'clear') {
      clearUserLimit(targetUser.id);
      await interaction.reply({ content: `✅ Rate limit cleared for ${targetUser.tag}.`, ephemeral: true });
    }
  } else if (subcommand === 'backup') {
    const action = interaction.options.getString('action', true);

    if (action === 'trigger') {
      const result = triggerManualBackup();
      await interaction.reply({ content: `✅ ${result}`, ephemeral: true });
    } else if (action === 'list') {
      const backups = listBackups();
      const list = backups.length > 0 ? backups.slice(-10).join('\n') : 'No backups found.';
      await interaction.reply({
        content: `**Recent Backups:**\n\`\`\`\n${list}\n\`\`\``,
        ephemeral: true
      });
    }
  }
}